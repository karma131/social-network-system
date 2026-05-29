import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PostStatus, PostVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HashtagsService } from '../hashtags/hashtags.service';
import { extractHashtags } from '../hashtags/util/hashtag-parser';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

/** Shared select for every post-returning endpoint so they emit one shape. */
const POST_SELECT = {
  id: true,
  content: true,
  commentCount: true,
  reactionCount: true,
  shareCount: true,
  createdAt: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
  media: {
    select: { fileUrl: true, fileType: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  },
  reactions: { select: { type: true, userId: true } },
  hashtags: { select: { hashtag: { select: { tag: true } } } },
} satisfies Prisma.PostSelect;

type PostRow = Prisma.PostGetPayload<{ select: typeof POST_SELECT }>;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashtagsService: HashtagsService,
  ) {}

  /** Maps a BE post row to the frontend PostDTO contract. */
  private toPostDto(post: PostRow, viewerId?: string) {
    const reactions = {
      like: 0,
      love: 0,
      care: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    };
    let myReaction: string | null = null;
    for (const r of post.reactions) {
      const key = r.type.toLowerCase() as keyof typeof reactions;
      if (key in reactions) reactions[key] += 1;
      if (viewerId && r.userId.toString() === viewerId) {
        myReaction = r.type.toLowerCase();
      }
    }

    const image = post.media.find((m) => m.fileType === 'image');
    const video = post.media.find((m) => m.fileType === 'video');

    return {
      id: post.id.toString(),
      authorId: post.user.id.toString(),
      authorName: post.user.name,
      authorAvatarUrl: post.user.avatarUrl ?? '',
      text: post.content ?? '',
      imageUrl: image?.fileUrl ?? null,
      videoUrl: video?.fileUrl ?? null,
      feeling: null,
      isLive: false,
      reactions,
      myReaction,
      commentsCount: post.commentCount,
      sharesCount: post.shareCount,
      sharedFrom: null,
      pinnedAt: null,
      createdAt: post.createdAt.getTime(),
      tags: post.hashtags.map((h) => h.hashtag.tag),
    };
  }

  async createPost(userId: string, dto: CreatePostDto) {
    if (!dto.content?.trim()) {
      throw new BadRequestException('Nội dung bài viết không được để trống');
    }

    const content = dto.content.trim();

    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          userId: BigInt(userId),
          content,
          visibility: dto.visibility,
          status: PostStatus.PUBLISHED,
        },
        select: { id: true },
      });

      await this.hashtagsService.applyTagDiff(
        tx,
        created.id,
        [],
        extractHashtags(content),
      );

      return tx.post.findUniqueOrThrow({
        where: { id: created.id },
        select: POST_SELECT,
      });
    });

    return {
      message: 'Tạo bài viết thành công',
      post: this.toPostDto(post, userId),
    };
  }

  async getPublicPosts(viewerId?: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: POST_SELECT,
    });

    return {
      message: 'Lấy danh sách bài viết thành công',
      posts: posts.map((post) => this.toPostDto(post, viewerId)),
    };
  }

  async getMyPosts(userId: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        userId: BigInt(userId),
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: POST_SELECT,
    });

    return {
      message: 'Lấy bài viết của tôi thành công',
      posts: posts.map((post) => this.toPostDto(post, userId)),
    };
  }

  async getPostById(postId: string, viewerId?: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: BigInt(postId),
        deletedAt: null,
      },
      select: POST_SELECT,
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    return {
      message: 'Lấy chi tiết bài viết thành công',
      post: this.toPostDto(post, viewerId),
    };
  }

  async updatePost(postId: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: BigInt(postId),
      },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    if (post.userId !== BigInt(userId)) {
      throw new ForbiddenException('Bạn không có quyền sửa bài viết này');
    }

    if (
      dto.content !== undefined &&
      typeof dto.content === 'string' &&
      !dto.content.trim()
    ) {
      throw new BadRequestException('Nội dung bài viết không được để trống');
    }

    const nextContent =
      dto.content !== undefined ? dto.content.trim() : undefined;

    const updatedPost = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: {
          id: BigInt(postId),
        },
        data: {
          content: nextContent,
          visibility: dto.visibility,
        },
        select: { id: true },
      });

      if (nextContent !== undefined) {
        await this.hashtagsService.applyTagDiff(
          tx,
          updated.id,
          extractHashtags(post.content),
          extractHashtags(nextContent),
        );
      }

      return tx.post.findUniqueOrThrow({
        where: { id: updated.id },
        select: POST_SELECT,
      });
    });

    return {
      message: 'Cập nhật bài viết thành công',
      post: this.toPostDto(updatedPost, userId),
    };
  }
}
