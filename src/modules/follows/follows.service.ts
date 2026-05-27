import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FollowUserDto } from './dto/follow-user.dto';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async followUser(currentUserId: string, dto: FollowUserDto) {
    const followerId = BigInt(currentUserId);
    const followingId = BigInt(dto.followingId);

    if (followerId === followingId) {
      throw new BadRequestException('Bạn không thể tự theo dõi chính mình');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: followingId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng cần theo dõi');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Bạn đã theo dõi người dùng này rồi');
    }

    const follow = await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
      select: {
        id: true,
        followerId: true,
        followingId: true,
        createdAt: true,
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Theo dõi người dùng thành công',
      follow: {
        ...follow,
        id: follow.id.toString(),
        followerId: follow.followerId.toString(),
        followingId: follow.followingId.toString(),
        following: {
          ...follow.following,
          id: follow.following.id.toString(),
        },
      },
    };
  }

  async unfollowUser(currentUserId: string, targetUserId: string) {
    const followerId = BigInt(currentUserId);
    const followingId = BigInt(targetUserId);

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      throw new NotFoundException('Bạn chưa theo dõi người dùng này');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return {
      message: 'Bỏ theo dõi thành công',
    };
  }

  async getFollowers(userId: string) {
    const targetUserId = BigInt(userId);

    const user = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const followers = await this.prisma.follow.findMany({
      where: {
        followingId: targetUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    return {
      message: 'Lấy danh sách follower thành công',
      followers: followers.map((item) => ({
        id: item.id.toString(),
        createdAt: item.createdAt,
        user: {
          ...item.follower,
          id: item.follower.id.toString(),
        },
      })),
    };
  }

  async getFollowing(userId: string) {
    const targetUserId = BigInt(userId);

    const user = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const following = await this.prisma.follow.findMany({
      where: {
        followerId: targetUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    return {
      message: 'Lấy danh sách đang theo dõi thành công',
      following: following.map((item) => ({
        id: item.id.toString(),
        createdAt: item.createdAt,
        user: {
          ...item.following,
          id: item.following.id.toString(),
        },
      })),
    };
  }

  async checkFollow(currentUserId: string, targetUserId: string) {
    const followerId = BigInt(currentUserId);
    const followingId = BigInt(targetUserId);

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      select: {
        id: true,
      },
    });

    return {
      message: 'Kiểm tra trạng thái theo dõi thành công',
      isFollowing: !!existingFollow,
    };
  }
}