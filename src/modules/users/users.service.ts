import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: BigInt(userId),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      message: 'Lấy thông tin người dùng thành công',
      user: {
        ...user,
        id: user.id.toString(),
      },
    };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: BigInt(userId),
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: BigInt(userId),
      },
      data: {
        fullName: dto.fullName?.trim(),
        avatarUrl: dto.avatarUrl?.trim(),
        coverUrl: dto.coverUrl?.trim(),
        bio: dto.bio?.trim(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Cập nhật hồ sơ thành công',
      user: {
        ...updatedUser,
        id: updatedUser.id.toString(),
      },
    };
  }
}