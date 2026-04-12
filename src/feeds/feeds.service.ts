import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedsService {
  constructor(private prisma: PrismaService) {}

  async getMyFeed(userId: number) {
    const followingList = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = followingList.map((item) => item.followingId);

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: {
          in: followingIds,
        },
      },
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        reactions: true,
      },
    });

    return {
      message: 'Get feed successful',
      posts,
    };
  }
}