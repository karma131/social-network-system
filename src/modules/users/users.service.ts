import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { Express } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateCoverDto } from './dto/update-cover.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { mapPrivateUser, mapPublicUser } from './user-response.mapper';

const PRIVATE_USER_SELECT = {
  id: true,
  name: true,
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
} as const;

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  coverUrl: true,
  bio: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureActiveAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Khong tim thay nguoi dung');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Tai khoan khong duoc phep thuc hien thao tac nay');
    }

    return user;
  }

  private fileToUrl(file?: Express.Multer.File) {
    if (!file) {
      return undefined;
    }

    return `/${process.env.UPLOAD_DIR || 'uploads'}/${file.filename}`;
  }

  async getMyProfile(userId: string) {
    await this.ensureActiveAccount(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: PRIVATE_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Khong tim thay nguoi dung');
    }

    return {
      success: true,
      message: 'Lay thong tin nguoi dung thanh cong',
      data: mapPrivateUser(user),
    };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    await this.ensureActiveAccount(userId);

    const data: {
      name?: string;
      bio?: string | null;
    } = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Ho ten khong duoc de trong');
      }
      data.name = name;
    }

    if (dto.bio !== undefined) {
      const bio = dto.bio.trim();
      data.bio = bio || null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data,
      select: PRIVATE_USER_SELECT,
    });

    return {
      message: 'Cap nhat ho so thanh cong',
      user: mapPrivateUser(updatedUser),
    };
  }

  async updateAvatar(
    userId: string,
    dto: UpdateAvatarDto,
    file?: Express.Multer.File,
  ) {
    await this.ensureActiveAccount(userId);

    const avatarUrl = this.fileToUrl(file) || dto.avatarUrl?.trim();
    if (!avatarUrl) {
      throw new BadRequestException('Can cung cap avatarUrl hoac file avatar');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data: { avatarUrl },
      select: PRIVATE_USER_SELECT,
    });

    return {
      message: 'Cap nhat avatar thanh cong',
      user: mapPrivateUser(updatedUser),
    };
  }

  async updateCover(
    userId: string,
    dto: UpdateCoverDto,
    file?: Express.Multer.File,
  ) {
    await this.ensureActiveAccount(userId);

    const coverUrl = this.fileToUrl(file) || dto.coverUrl?.trim();
    if (!coverUrl) {
      throw new BadRequestException('Can cung cap coverUrl hoac file cover');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data: { coverUrl },
      select: PRIVATE_USER_SELECT,
    });

    return {
      message: 'Cap nhat anh bia thanh cong',
      user: mapPrivateUser(updatedUser),
    };
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: BigInt(userId),
        deletedAt: null,
        status: {
          notIn: [UserStatus.BANNED, UserStatus.LOCKED],
        },
      },
      select: PUBLIC_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Khong tim thay nguoi dung');
    }

    return {
      message: 'Lay thong tin public cua nguoi dung thanh cong',
      user: mapPublicUser(user),
    };
  }

  async getUsers(query: QueryUsersDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: PRIVATE_USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      message: 'Lay danh sach nguoi dung thanh cong',
      users: users.map(mapPrivateUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  isAdminRole(role?: string) {
    return role === UserRole.ADMIN;
  }
}
