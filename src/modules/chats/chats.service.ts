import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Message as MessageRow } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ChatHistoryResponseDTO,
  ChatMessageDTO,
  MessageReactionDTO,
  ReactionKey,
  ReplyContextDTO,
} from './dto/chat-message.dto';
import type { CreateChatGroupDto } from './dto/create-chat-group.dto';
import type { SendChatMessageDto } from './dto/send-chat-message.dto';

const SYSTEM_SENDER = 'system';
const REPLY_SNIPPET_MAX = 140;

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  // Conversation IDs encode their kind. DMs are `dm:<a>:<b>` with the two IDs
  // sorted lexicographically; only the two participants may read. Groups use
  // `group:<uuid>` and currently have no membership table on this side, so we
  // accept any authed viewer (TODO once GroupMember lands — mirrors target).
  private async assertCanRead(
    conversationId: string,
    viewerId: string,
  ): Promise<void> {
    if (conversationId.startsWith('dm:')) {
      const [, a, b] = conversationId.split(':');
      if (!a || !b) {
        throw new BadRequestException('Malformed conversationId');
      }
      if (viewerId !== a && viewerId !== b) {
        throw new ForbiddenException('Not a participant');
      }
      return;
    }
    if (conversationId.startsWith('group:')) {
      const membership = await this.prisma.chatGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: conversationId,
            userId: BigInt(viewerId),
          },
        },
        select: { userId: true },
      });
      if (!membership) throw new ForbiddenException('Not a group member');
      return;
    }
    throw new BadRequestException('Unknown conversation kind');
  }

  private toGroupDto(group: {
    id: string;
    name: string;
    createdBy: bigint;
    createdAt: Date;
    members: {
      userId: bigint;
      isAdmin: boolean;
      isMuted: boolean;
      isBlocked: boolean;
    }[];
  }) {
    return {
      conversationId: group.id,
      name: group.name,
      memberIds: group.members.map((member) => member.userId.toString()),
      adminIds: group.members
        .filter((member) => member.isAdmin)
        .map((member) => member.userId.toString()),
      mutedMembers: group.members
        .filter((member) => member.isMuted)
        .map((member) => member.userId.toString()),
      blockedMembers: group.members
        .filter((member) => member.isBlocked)
        .map((member) => member.userId.toString()),
      createdAt: group.createdAt.getTime(),
      createdBy: group.createdBy.toString(),
    };
  }

  async createGroup(viewerId: string, dto: CreateChatGroupDto) {
    const creatorId = BigInt(viewerId);
    const memberIds = [
      ...new Set([viewerId, ...dto.memberIds].map((id) => BigInt(id))),
    ];
    if (memberIds.length < 3) {
      throw new BadRequestException('A group needs at least 3 members');
    }

    const existingUsers = await this.prisma.user.count({
      where: { id: { in: memberIds }, deletedAt: null },
    });
    if (existingUsers !== memberIds.length) {
      throw new NotFoundException('One or more members do not exist');
    }

    const group = await this.prisma.chatGroup.create({
      data: {
        id: `group:${randomUUID()}`,
        name: dto.name.trim(),
        createdBy: creatorId,
        members: {
          create: memberIds.map((userId) => ({
            userId,
            isAdmin: userId === creatorId,
          })),
        },
      },
      include: { members: true },
    });
    return this.toGroupDto(group);
  }

  async listGroups(viewerId: string) {
    const groups = await this.prisma.chatGroup.findMany({
      where: { members: { some: { userId: BigInt(viewerId) } } },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });
    return groups.map((group) => this.toGroupDto(group));
  }

  async sendGroupMessage(
    conversationId: string,
    viewerId: string,
    dto: SendChatMessageDto,
  ): Promise<ChatMessageDTO> {
    if (!conversationId.startsWith('group:')) {
      throw new BadRequestException('Group conversation required');
    }
    await this.assertCanRead(conversationId, viewerId);

    const sender = await this.prisma.user.findUnique({
      where: { id: BigInt(viewerId) },
      select: { name: true },
    });
    if (!sender) throw new NotFoundException('Sender not found');

    if (dto.replyToId) {
      const parent = await this.prisma.message.findFirst({
        where: { id: dto.replyToId, conversationId },
        select: { id: true },
      });
      if (!parent) throw new BadRequestException('Reply message not found');
    }

    const row = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: viewerId,
        senderName: sender.name,
        content: dto.content,
        type: dto.type ?? 'text',
        replyToId: dto.replyToId,
      },
    });
    const [message] = await this.hydrate([row]);
    return message;
  }

  private replySnippet(type: string, content: string): string {
    return type === 'text' && content.length > REPLY_SNIPPET_MAX
      ? content.slice(0, REPLY_SNIPPET_MAX) + '…'
      : content;
  }

  private toReplyContext(parent: MessageRow | null): ReplyContextDTO | undefined {
    if (!parent || parent.deleted || parent.type === 'system') return undefined;
    return {
      id: parent.id,
      senderId: parent.senderId ?? SYSTEM_SENDER,
      senderName: parent.senderName,
      content: this.replySnippet(parent.type, parent.content),
      type: parent.type as ReplyContextDTO['type'],
    };
  }

  private rowToDto(
    row: MessageRow,
    replyTo: ReplyContextDTO | undefined,
    reactions: MessageReactionDTO[] | undefined,
  ): ChatMessageDTO {
    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId ?? SYSTEM_SENDER,
      senderName: row.senderName,
      content: row.content,
      timestamp: row.createdAt.getTime(),
      type: row.type as ChatMessageDTO['type'],
      ...(replyTo ? { replyTo } : {}),
      ...(row.editedAt ? { editedAt: row.editedAt.getTime() } : {}),
      ...(row.deleted ? { deleted: true } : {}),
      ...(reactions && reactions.length ? { reactions } : {}),
    };
  }

  // Resolve reply parents + reactions for the whole page in two batched
  // queries — never N+1. Mirrors target's chat.service hydrate().
  private async hydrate(rows: MessageRow[]): Promise<ChatMessageDTO[]> {
    if (rows.length === 0) return [];

    const parentIds = [
      ...new Set(rows.map((r) => r.replyToId).filter((v): v is string => !!v)),
    ];
    const messageIds = rows.map((r) => r.id);

    const [parents, reactions] = await Promise.all([
      parentIds.length
        ? this.prisma.message.findMany({ where: { id: { in: parentIds } } })
        : Promise.resolve([] as MessageRow[]),
      this.prisma.messageReaction.findMany({
        where: { messageId: { in: messageIds } },
      }),
    ]);

    const parentById = new Map(parents.map((p) => [p.id, p]));
    const reactionsByMessage = new Map<string, MessageReactionDTO[]>();
    for (const r of reactions) {
      const list = reactionsByMessage.get(r.messageId) ?? [];
      list.push({
        userId: r.userId,
        userName: r.userName,
        emoji: r.emoji as ReactionKey,
      });
      reactionsByMessage.set(r.messageId, list);
    }

    return rows.map((r) =>
      this.rowToDto(
        r,
        r.replyToId
          ? this.toReplyContext(parentById.get(r.replyToId) ?? null)
          : undefined,
        reactionsByMessage.get(r.id),
      ),
    );
  }

  // Cursor-paginated history. Scans newest-first from the cursor, reverses so
  // the page is oldest→newest (matches target's wire shape and the FE
  // infinite-query `getNextPageParam` stacking).
  async listHistory(
    conversationId: string,
    viewerId: string,
    cursor: number | undefined,
    cursorId: string | undefined,
    limit: number,
  ): Promise<ChatHistoryResponseDTO> {
    await this.assertCanRead(conversationId, viewerId);

    const cursorDate = cursor ? new Date(cursor) : undefined;
    const rows = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(cursorDate
          ? {
              OR: [
                { createdAt: { lt: cursorDate } },
                ...(cursorId
                  ? [{ createdAt: cursorDate, id: { lt: cursorId } }]
                  : []),
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = (hasMore ? rows.slice(0, limit) : rows).reverse();
    const messages = await this.hydrate(page);

    return {
      messages,
      nextCurosr:
        hasMore && page.length ? page[0].createdAt.getTime() : null,
      nextCursorId: hasMore && page.length ? page[0].id : null,
      hasMore,
    };
  }
}
