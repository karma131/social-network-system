import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: BigInt(userId),
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        actorId: true,
        type: true,
        postId: true,
        commentId: true,
        messageId: true,
        contentSnapshot: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Lấy danh sách thông báo thành công',
      notifications: notifications.map((item) => ({
        ...item,
        id: item.id.toString(),
        userId: item.userId.toString(),
        actorId: item.actorId ? item.actorId.toString() : null,
        postId: item.postId ? item.postId.toString() : null,
        commentId: item.commentId ? item.commentId.toString() : null,
        messageId: item.messageId ? item.messageId.toString() : null,
        actor: item.actor
          ? {
              ...item.actor,
              id: item.actor.id.toString(),
            }
          : null,
      })),
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId: BigInt(userId),
        isRead: false,
      },
    });

    return {
      message: 'Lấy số lượng thông báo chưa đọc thành công',
      unreadCount: count,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: BigInt(notificationId),
        userId: BigInt(userId),
      },
      select: {
        id: true,
        isRead: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    if (notification.isRead) {
      return {
        message: 'Thông báo đã được đánh dấu đọc trước đó',
      };
    }

    await this.prisma.notification.update({
      where: {
        id: BigInt(notificationId),
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      message: 'Đánh dấu thông báo đã đọc thành công',
    };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId: BigInt(userId),
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      message: 'Đánh dấu tất cả thông báo đã đọc thành công',
    };
  }
}