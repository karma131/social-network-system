import { Injectable } from '@nestjs/common';
import { Prisma, PostStatus, PostVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HashtagsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTrending(limit: number) {
    const rows = await this.prisma.hashtag.findMany({
      where: { usageCount: { gt: 0 } },
      orderBy: [{ usageCount: 'desc' }, { tag: 'asc' }],
      take: limit,
      select: { tag: true, usageCount: true },
    });

    return {
      message: 'Lấy hashtag thịnh hành thành công',
      hashtags: rows.map((r) => ({ tag: r.tag, count: r.usageCount })),
    };
  }

  async listPostsByTag(tag: string) {
    const normalized = tag.toLowerCase();

    const hashtag = await this.prisma.hashtag.findUnique({
      where: { tag: normalized },
      select: { id: true },
    });

    if (!hashtag) {
      return {
        message: 'Lấy bài viết theo hashtag thành công',
        posts: [],
      };
    }

    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
        deletedAt: null,
        hashtags: { some: { hashtagId: hashtag.id } },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
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
      },
    });

    return {
      message: 'Lấy bài viết theo hashtag thành công',
      posts: posts.map((post) => ({
        ...post,
        id: post.id.toString(),
        user: {
          ...post.user,
          id: post.user.id.toString(),
        },
      })),
    };
  }

  // Apply tag-set diff atomically inside a Prisma transaction. Caller wraps
  // this in `prisma.$transaction` so post mutation + hashtag counts commit
  // or rollback together — mirrors target's applyTagDiff.
  async applyTagDiff(
    tx: Prisma.TransactionClient,
    postId: bigint,
    prev: string[],
    next: string[],
  ): Promise<void> {
    const prevSet = new Set(prev);
    const nextSet = new Set(next);
    const added = next.filter((t) => !prevSet.has(t));
    const removed = prev.filter((t) => !nextSet.has(t));

    for (const tag of added) {
      const hashtag = await tx.hashtag.upsert({
        where: { tag },
        update: { usageCount: { increment: 1 } },
        create: { tag, usageCount: 1 },
        select: { id: true },
      });
      await tx.postHashtag.create({
        data: { postId, hashtagId: hashtag.id },
      });
    }

    for (const tag of removed) {
      const hashtag = await tx.hashtag.findUnique({
        where: { tag },
        select: { id: true },
      });
      if (!hashtag) continue;
      await tx.postHashtag.delete({
        where: { postId_hashtagId: { postId, hashtagId: hashtag.id } },
      });
      await tx.hashtag.update({
        where: { id: hashtag.id },
        data: { usageCount: { decrement: 1 } },
      });
    }
  }
}
