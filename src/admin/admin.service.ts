import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        cover: true,
        bio: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Get users successful',
      users,
    };
  }

  async updateUserStatus(userId: number, data: UpdateUserStatusDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: data.status as any,
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

    return {
      message: 'Update user status successful',
      user,
    };
  }

  async getAllPosts() {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return {
      message: 'Get posts successful',
      posts,
    };
  }

  async deletePost(postId: number) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return {
      message: 'Delete post successful',
    };
  }
}