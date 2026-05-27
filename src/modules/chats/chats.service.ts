import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationType, MessageStatus, MessageType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDirectConversation(
    currentUserId: string,
    dto: CreateDirectConversationDto,
  ) {
    const myId = BigInt(currentUserId);
    const targetUserId = BigInt(dto.targetUserId);

    if (myId === targetUserId) {
      throw new BadRequestException('Bạn không thể tự chat với chính mình');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const myConversations = await this.prisma.conversationParticipant.findMany({
      where: {
        userId: myId,
        leftAt: null,
      },
      select: {
        conversationId: true,
        conversation: {
          select: {
            id: true,
            type: true,
            participants: {
              where: {
                leftAt: null,
              },
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    const existingDirect = myConversations.find((item) => {
      const conversation = item.conversation;
      if (conversation.type !== ConversationType.DIRECT) return false;

      const ids = conversation.participants.map((p) => p.userId.toString()).sort();
      const expected = [myId.toString(), targetUserId.toString()].sort();

      return ids.length === 2 && ids[0] === expected[0] && ids[1] === expected[1];
    });

    if (existingDirect) {
      return {
        message: 'Cuộc trò chuyện đã tồn tại',
        conversation: {
          id: existingDirect.conversation.id.toString(),
          type: existingDirect.conversation.type,
        },
      };
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        createdById: myId,
        participants: {
          create: [
            {
              userId: myId,
            },
            {
              userId: targetUserId,
            },
          ],
        },
      },
      select: {
        id: true,
        type: true,
        title: true,
        createdAt: true,
        participants: {
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Tạo cuộc trò chuyện riêng thành công',
      conversation: {
        ...conversation,
        id: conversation.id.toString(),
        participants: conversation.participants.map((p) => ({
          ...p,
          id: p.id.toString(),
          userId: p.userId.toString(),
          user: {
            ...p.user,
            id: p.user.id.toString(),
          },
        })),
      },
    };
  }

  async createGroupConversation(
    currentUserId: string,
    dto: CreateGroupConversationDto,
  ) {
    const myId = BigInt(currentUserId);

    const uniqueIds = [...new Set(dto.participantIds)];
    const participantIds = uniqueIds
      .filter((id) => id !== currentUserId)
      .map((id) => BigInt(id));

    if (participantIds.length === 0) {
      throw new BadRequestException('Nhóm phải có ít nhất 1 thành viên khác');
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: participantIds,
        },
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (users.length !== participantIds.length) {
      throw new NotFoundException('Có người dùng không tồn tại');
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: ConversationType.GROUP,
        title: dto.title?.trim() || null,
        createdById: myId,
        participants: {
          create: [
            { userId: myId, isAdmin: true },
            ...participantIds.map((id) => ({
              userId: id,
              isAdmin: false,
            })),
          ],
        },
      },
      select: {
        id: true,
        type: true,
        title: true,
        createdAt: true,
        participants: {
          select: {
            id: true,
            userId: true,
            isAdmin: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Tạo nhóm chat thành công',
      conversation: {
        ...conversation,
        id: conversation.id.toString(),
        participants: conversation.participants.map((p) => ({
          ...p,
          id: p.id.toString(),
          userId: p.userId.toString(),
          user: {
            ...p.user,
            id: p.user.id.toString(),
          },
        })),
      },
    };
  }

  async getMyConversations(currentUserId: string) {
    const myId = BigInt(currentUserId);

    const conversations = await this.prisma.conversationParticipant.findMany({
      where: {
        userId: myId,
        leftAt: null,
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
      select: {
        id: true,
        conversation: {
          select: {
            id: true,
            type: true,
            title: true,
            updatedAt: true,
            createdAt: true,
            lastMessage: {
              select: {
                id: true,
                content: true,
                type: true,
                createdAt: true,
                sender: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            participants: {
              where: {
                leftAt: null,
              },
              select: {
                id: true,
                userId: true,
                isAdmin: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      message: 'Lấy danh sách cuộc trò chuyện thành công',
      conversations: conversations.map((item) => ({
        id: item.conversation.id.toString(),
        type: item.conversation.type,
        title: item.conversation.title,
        createdAt: item.conversation.createdAt,
        updatedAt: item.conversation.updatedAt,
        lastMessage: item.conversation.lastMessage
          ? {
              ...item.conversation.lastMessage,
              id: item.conversation.lastMessage.id.toString(),
              sender: item.conversation.lastMessage.sender
                ? {
                    ...item.conversation.lastMessage.sender,
                    id: item.conversation.lastMessage.sender.id.toString(),
                  }
                : null,
            }
          : null,
        participants: item.conversation.participants.map((p) => ({
          ...p,
          id: p.id.toString(),
          userId: p.userId.toString(),
          user: {
            ...p.user,
            id: p.user.id.toString(),
          },
        })),
      })),
    };
  }

  async getConversationById(conversationId: string, currentUserId: string) {
    const conversationBigInt = BigInt(conversationId);
    const myId = BigInt(currentUserId);

    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId: conversationBigInt,
        userId: myId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationBigInt,
      },
      select: {
        id: true,
        type: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        participants: {
          where: {
            leftAt: null,
          },
          select: {
            id: true,
            userId: true,
            isAdmin: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    return {
      message: 'Lấy chi tiết cuộc trò chuyện thành công',
      conversation: {
        ...conversation,
        id: conversation.id.toString(),
        participants: conversation.participants.map((p) => ({
          ...p,
          id: p.id.toString(),
          userId: p.userId.toString(),
          user: {
            ...p.user,
            id: p.user.id.toString(),
          },
        })),
      },
    };
  }

  async sendMessage(
    conversationId: string,
    currentUserId: string,
    dto: SendMessageDto,
  ) {
    const conversationBigInt = BigInt(conversationId);
    const myId = BigInt(currentUserId);

    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId: conversationBigInt,
        userId: myId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    if (!dto.content.trim()) {
      throw new BadRequestException('Nội dung tin nhắn không được để trống');
    }

    if (dto.replyToMessageId) {
      const replyMessage = await this.prisma.message.findFirst({
        where: {
          id: BigInt(dto.replyToMessageId),
          conversationId: conversationBigInt,
          deletedAt: null,
        },
      });

      if (!replyMessage) {
        throw new NotFoundException('Không tìm thấy tin nhắn được trả lời');
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversationBigInt,
        senderId: myId,
        type: MessageType.TEXT,
        content: dto.content.trim(),
        replyToMessageId: dto.replyToMessageId
          ? BigInt(dto.replyToMessageId)
          : null,
        status: MessageStatus.SENT,
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        type: true,
        content: true,
        replyToMessageId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: {
        id: conversationBigInt,
      },
      data: {
        lastMessageId: message.id,
      },
    });

    return {
      message: 'Gửi tin nhắn thành công',
      data: {
        ...message,
        id: message.id.toString(),
        conversationId: message.conversationId.toString(),
        senderId: message.senderId ? message.senderId.toString() : null,
        replyToMessageId: message.replyToMessageId
          ? message.replyToMessageId.toString()
          : null,
        sender: message.sender
          ? {
              ...message.sender,
              id: message.sender.id.toString(),
            }
          : null,
      },
    };
  }

  async getMessages(
    conversationId: string,
    currentUserId: string,
    query: GetMessagesDto,
  ) {
    const conversationBigInt = BigInt(conversationId);
    const myId = BigInt(currentUserId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId: conversationBigInt,
        userId: myId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          conversationId: conversationBigInt,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          conversationId: true,
          senderId: true,
          type: true,
          content: true,
          replyToMessageId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.message.count({
        where: {
          conversationId: conversationBigInt,
          deletedAt: null,
        },
      }),
    ]);

    return {
      message: 'Lấy danh sách tin nhắn thành công',
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      messages: messages.map((message) => ({
        ...message,
        id: message.id.toString(),
        conversationId: message.conversationId.toString(),
        senderId: message.senderId ? message.senderId.toString() : null,
        replyToMessageId: message.replyToMessageId
          ? message.replyToMessageId.toString()
          : null,
        sender: message.sender
          ? {
              ...message.sender,
              id: message.sender.id.toString(),
            }
          : null,
      })),
    };
  }

  async markConversationAsRead(conversationId: string, currentUserId: string) {
    const conversationBigInt = BigInt(conversationId);
    const myId = BigInt(currentUserId);

    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId: conversationBigInt,
        userId: myId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    const latestMessage = await this.prisma.message.findFirst({
      where: {
        conversationId: conversationBigInt,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    });

    if (!latestMessage) {
      return {
        message: 'Cuộc trò chuyện chưa có tin nhắn',
      };
    }

    await this.prisma.conversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadMessageId: latestMessage.id,
      },
    });

    const existingRead = await this.prisma.messageRead.findFirst({
      where: {
        messageId: latestMessage.id,
        userId: myId,
      },
      select: {
        id: true,
      },
    });

    if (!existingRead) {
      await this.prisma.messageRead.create({
        data: {
          messageId: latestMessage.id,
          userId: myId,
        },
      });
    }

    return {
      message: 'Đánh dấu đã đọc thành công',
      lastReadMessageId: latestMessage.id.toString(),
    };
  }
}