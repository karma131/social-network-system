import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async banUser(adminId: string, userId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: BigInt(userId),
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: BigInt(userId),
      },
      data: {
        status: UserStatus.BANNED,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId: BigInt(adminId),
        action: 'BAN_USER',
        targetType: 'USER',
        targetId: BigInt(userId),
        reason: 'Khóa tài khoản người dùng',
      },
    });

    return {
      message: 'Khóa người dùng thành công',
      user: {
        ...updatedUser,
        id: updatedUser.id.toString(),
      },
    };
  }

  async unbanUser(adminId: string, userId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: BigInt(userId),
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: BigInt(userId),
      },
      data: {
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId: BigInt(adminId),
        action: 'UNBAN_USER',
        targetType: 'USER',
        targetId: BigInt(userId),
        reason: 'Mở khóa tài khoản người dùng',
      },
    });

    return {
      message: 'Mở khóa người dùng thành công',
      user: {
        ...updatedUser,
        id: updatedUser.id.toString(),
      },
    };
  }

  async hidePost(adminId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: BigInt(postId),
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const updatedPost = await this.prisma.post.update({
      where: {
        id: BigInt(postId),
      },
      data: {
        status: PostStatus.HIDDEN,
      },
      select: {
        id: true,
        userId: true,
        content: true,
        visibility: true,
        status: true,
        updatedAt: true,
      },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId: BigInt(adminId),
        action: 'HIDE_POST',
        targetType: 'POST',
        targetId: BigInt(postId),
        reason: 'Ẩn bài viết',
      },
    });

    return {
      message: 'Ẩn bài viết thành công',
      post: {
        ...updatedPost,
        id: updatedPost.id.toString(),
        userId: updatedPost.userId.toString(),
      },
    };
  }

  async deletePost(adminId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: BigInt(postId),
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const deletedPost = await this.prisma.post.update({
      where: {
        id: BigInt(postId),
      },
      data: {
        status: PostStatus.DELETED,
        deletedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        status: true,
        deletedAt: true,
      },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId: BigInt(adminId),
        action: 'DELETE_POST',
        targetType: 'POST',
        targetId: BigInt(postId),
        reason: 'Xóa mềm bài viết',
      },
    });

    return {
      message: 'Xóa bài viết thành công',
      post: {
        ...deletedPost,
        id: deletedPost.id.toString(),
        userId: deletedPost.userId.toString(),
      },
    };
  }

  async getAdminLogs() {
    const logs = await this.prisma.adminLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        adminId: true,
        action: true,
        targetType: true,
        targetId: true,
        reason: true,
        createdAt: true,
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Lấy danh sách lịch sử admin thành công',
      logs: logs.map((log) => ({
        ...log,
        id: log.id.toString(),
        adminId: log.adminId.toString(),
        targetId: log.targetId.toString(),
        admin: {
          ...log.admin,
          id: log.admin.id.toString(),
        },
      })),
    };
  }
}