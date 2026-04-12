import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Get my profile successful',
      user,
    };
  }

  async updateMe(userId: number, data: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        avatar: data.avatar,
        cover: data.cover,
        bio: data.bio,
      },
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
      message: 'Update profile successful',
      user,
    };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Get user successful',
      user,
    };
  }
}