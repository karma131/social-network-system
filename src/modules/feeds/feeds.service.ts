import { Injectable } from '@nestjs/common';
import { PostStatus, PostVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetMyFeedDto } from './dto/get-my-feed.dto';

@Injectable()
export class FeedsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyFeed(currentUserId: string, query: GetMyFeedDto) {
    const userId = BigInt(currentUserId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const followingList = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = followingList.map((item) => item.followingId);

    const allowedAuthorIds = [userId, ...followingIds];

    const whereCondition = {
      deletedAt: null,
      status: PostStatus.PUBLISHED,
      OR: [
        {
          userId: userId,
        },
        {
          userId: {
            in: allowedAuthorIds,
          },
          visibility: {
            in: [PostVisibility.PUBLIC, PostVisibility.FOLLOWERS],
          },
        },
      ],
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          content: true,
          visibility: true,
          status: true,
          commentCount: true,
          reactionCount: true,
          shareCount: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          reactions: {
            where: {
              userId,
            },
            select: {
              id: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.post.count({
        where: whereCondition,
      }),
    ]);

    return {
      message: 'Lấy bảng tin thành công',
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      posts: posts.map((post) => ({
        ...post,
        id: post.id.toString(),
        userId: post.userId.toString(),
        user: {
          ...post.user,
          id: post.user.id.toString(),
        },
        myReaction: post.reactions.length > 0 ? post.reactions[0].type : null,
      })),
    };
  }
}