import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatsGateway } from './chats.gateway';

@Injectable()
export class ChatsService {
  constructor(
    private prisma: PrismaService,
    private chatsGateway: ChatsGateway,
  ) {}

  async createConversation(currentUserId: number, dto: CreateConversationDto) {
    const allUserIds = Array.from(new Set([currentUserId, ...dto.participantIds]));

    const users = await this.prisma.user.findMany({
      where: { id: { in: allUserIds } },
      select: { id: true },
    });

    if (users.length !== allUserIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        participants: {
          create: allUserIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Create conversation successful',
      conversation,
    };
  }

  async sendMessage(currentUserId: number, dto: SendMessageDto) {
    const participant = await this.prisma.conversationUser.findFirst({
      where: {
        conversationId: dto.conversationId,
        userId: currentUserId,
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not in this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: currentUserId,
        content: dto.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    this.chatsGateway.sendMessageToConversation(dto.conversationId, message);

    return {
      message: 'Send message successful',
      data: message,
    };
  }

  async getMyConversations(currentUserId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: currentUserId,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Get conversations successful',
      conversations,
    };
  }

  async getMessages(currentUserId: number, conversationId: number) {
    const participant = await this.prisma.conversationUser.findFirst({
      where: {
        conversationId,
        userId: currentUserId,
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not in this conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return {
      message: 'Get messages successful',
      messages,
    };
  }
}