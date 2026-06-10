import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PostStatus,
  PostVisibility,
  ReactionType,
  CommentStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HashtagsService } from '../hashtags/hashtags.service';
import { extractHashtags } from '../hashtags/util/hashtag-parser';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

/** Shared select for every post-returning endpoint so they emit one shape. */
const POST_SELECT = {
  id: true,
  content: true,
  visibility: true,
  commentCount: true,
  reactionCount: true,
  shareCount: true,
  createdAt: true,
  pinnedAt: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
  media: {
    select: { fileUrl: true, fileType: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  },
  reactions: { select: { type: true, userId: true } },
  hashtags: { select: { hashtag: { select: { tag: true } } } },
} satisfies Prisma.PostSelect;

type PostRow = Prisma.PostGetPayload<{ select: typeof POST_SELECT }>;

const COMMENT_SELECT = {
  id: true,
  postId: true,
  content: true,
  imageUrl: true,
  createdAt: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.CommentSelect;

type CommentRow = Prisma.CommentGetPayload<{ select: typeof COMMENT_SELECT }>;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashtagsService: HashtagsService,
  ) {}

  /** Persists FE-supplied media URLs as PostMedia rows (uploadId stays null). */
  private async createMedia(
    tx: Prisma.TransactionClient,
    postId: bigint,
    imageUrl?: string,
    videoUrl?: string,
  ) {
    const rows: Prisma.PostMediaCreateManyInput[] = [];
    if (imageUrl)
      rows.push({ postId, fileUrl: imageUrl, fileType: 'image', sortOrder: 0 });
    if (videoUrl)
      rows.push({ postId, fileUrl: videoUrl, fileType: 'video', sortOrder: 1 });
    if (rows.length) await tx.postMedia.createMany({ data: rows });
  }

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
      visibility: post.visibility,
      isLive: false,
      reactions,
      myReaction,
      commentsCount: post.commentCount,
      sharesCount: post.shareCount,
      sharedFrom: null,
      pinnedAt: post.pinnedAt ? post.pinnedAt.getTime() : null,
      createdAt: post.createdAt.getTime(),
      tags: post.hashtags
        .map((h) => h.hashtag?.tag)
        .filter((t): t is string => !!t),
    };
  }

  async createPost(userId: string, dto: CreatePostDto) {
    if (!dto.text?.trim()) {
      throw new BadRequestException('Nội dung bài viết không được để trống');
    }

    const content = dto.text.trim();

    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          userId: BigInt(userId),
          content,
          visibility: dto.visibility ?? PostVisibility.PUBLIC,
          status: PostStatus.PUBLISHED,
        },
        select: { id: true },
      });

      await this.createMedia(tx, created.id, dto.imageUrl, dto.videoUrl);

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

  async getPublicPosts(viewerId?: string, mine?: string, authorId?: string) {
    let where: Prisma.PostWhereInput;
    if (mine === '1' && viewerId) {
      // Own posts — any visibility/status except deleted.
      where = { userId: BigInt(viewerId), deletedAt: null };
    } else {
      const visibilityFilter: Prisma.PostWhereInput[] = [
        { visibility: PostVisibility.PUBLIC },
      ];

      if (viewerId) {
        const viewerUserId = BigInt(viewerId);
        const following = await this.prisma.follow.findMany({
          where: { followerId: viewerUserId },
          select: { followingId: true },
        });
        visibilityFilter.push(
          { userId: viewerUserId },
          {
            visibility: PostVisibility.FOLLOWERS,
            userId: { in: following.map((item) => item.followingId) },
          },
        );
      }

      where = {
        ...(authorId ? { userId: BigInt(authorId) } : {}),
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        OR: visibilityFilter,
      };
    }

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: POST_SELECT,
    });

    return {
      message: 'Lấy danh sách bài viết thành công',
      // Skip orphan rows (author deleted without cascade) so one bad row can't
      // 500 the whole feed.
      posts: posts
        .filter((post) => post.user)
        .map((post) => this.toPostDto(post, viewerId)),
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

    await this.assertCanViewPost(post.id, viewerId, post);

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
      dto.text !== undefined &&
      typeof dto.text === 'string' &&
      !dto.text.trim()
    ) {
      throw new BadRequestException('Nội dung bài viết không được để trống');
    }

    const nextContent = dto.text !== undefined ? dto.text.trim() : undefined;
    const touchesMedia =
      dto.imageUrl !== undefined || dto.videoUrl !== undefined;

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

      if (touchesMedia) {
        await tx.postMedia.deleteMany({ where: { postId: updated.id } });
        await this.createMedia(tx, updated.id, dto.imageUrl, dto.videoUrl);
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

  /** Maps a FE ReactionId (e.g. "haha") to the BE enum, or 400. */
  private toReactionType(emoji: string): ReactionType {
    const value = emoji.toUpperCase();
    if (!(value in ReactionType)) {
      throw new BadRequestException('Loại cảm xúc không hợp lệ');
    }
    return value as ReactionType;
  }

  private async assertCanViewPost(
    postId: bigint,
    viewerId?: string,
    selectedPost?: Pick<PostRow, 'id' | 'visibility' | 'user'>,
  ) {
    const post =
      selectedPost ??
      (await this.prisma.post.findFirst({
        where: { id: postId, deletedAt: null },
        select: {
          id: true,
          visibility: true,
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }));
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    if (post.visibility === PostVisibility.PUBLIC) return;
    if (!viewerId) {
      throw new ForbiddenException('Bạn không có quyền xem bài viết này');
    }

    const viewerUserId = BigInt(viewerId);
    if (post.user.id === viewerUserId) return;
    if (post.visibility === PostVisibility.PRIVATE) {
      throw new ForbiddenException('Bạn không có quyền xem bài viết này');
    }

    const followsAuthor = await this.prisma.follow.findFirst({
      where: {
        followerId: viewerUserId,
        followingId: post.user.id,
      },
      select: { followerId: true },
    });
    if (!followsAuthor) {
      throw new ForbiddenException('Bạn không có quyền xem bài viết này');
    }
  }

  async reactPost(postId: string, userId: string, emoji: string) {
    const type = this.toReactionType(emoji);
    const id = BigInt(postId);
    await this.assertCanViewPost(id, userId);
    const uid = BigInt(userId);

    const post = await this.prisma.$transaction(async (tx) => {
      await tx.reaction.upsert({
        where: { userId_postId: { userId: uid, postId: id } },
        create: { userId: uid, postId: id, type },
        update: { type },
      });
      await tx.post.update({
        where: { id },
        data: {
          reactionCount: await tx.reaction.count({ where: { postId: id } }),
        },
      });
      return tx.post.findUniqueOrThrow({ where: { id }, select: POST_SELECT });
    });

    return {
      message: 'Thả cảm xúc thành công',
      post: this.toPostDto(post, userId),
    };
  }

  async unreactPost(postId: string, userId: string) {
    const id = BigInt(postId);
    await this.assertCanViewPost(id, userId);
    const uid = BigInt(userId);

    const post = await this.prisma.$transaction(async (tx) => {
      await tx.reaction.deleteMany({ where: { userId: uid, postId: id } });
      await tx.post.update({
        where: { id },
        data: {
          reactionCount: await tx.reaction.count({ where: { postId: id } }),
        },
      });
      return tx.post.findUniqueOrThrow({ where: { id }, select: POST_SELECT });
    });

    return {
      message: 'Bỏ cảm xúc thành công',
      post: this.toPostDto(post, userId),
    };
  }

  private toCommentDto(row: CommentRow) {
    return {
      id: row.id.toString(),
      postId: row.postId.toString(),
      authorId: row.user.id.toString(),
      authorName: row.user.name,
      authorAvatarUrl: row.user.avatarUrl ?? '',
      text: row.content,
      imageUrl: row.imageUrl ?? null,
      createdAt: row.createdAt.getTime(),
    };
  }

  async listComments(postId: string, viewerId?: string) {
    const id = BigInt(postId);
    await this.assertCanViewPost(id, viewerId);

    const rows = await this.prisma.comment.findMany({
      where: { postId: id, status: CommentStatus.ACTIVE, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: COMMENT_SELECT,
    });

    return {
      message: 'Lấy danh sách bình luận thành công',
      // Skip orphan comments (author deleted without cascade).
      comments: rows
        .filter((row) => row.user)
        .map((row) => this.toCommentDto(row)),
    };
  }

  async addComment(postId: string, userId: string, dto: CreateCommentDto) {
    const text = dto.text?.trim() ?? '';
    if (!text && !dto.imageUrl) {
      throw new BadRequestException('Bình luận phải có nội dung hoặc ảnh');
    }
    const id = BigInt(postId);
    await this.assertCanViewPost(id, userId);

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          postId: id,
          userId: BigInt(userId),
          content: text,
          imageUrl: dto.imageUrl ?? null,
        },
        select: COMMENT_SELECT,
      });
      await tx.post.update({
        where: { id },
        data: {
          commentCount: await tx.comment.count({
            where: {
              postId: id,
              status: CommentStatus.ACTIVE,
              deletedAt: null,
            },
          }),
        },
      });
      return created;
    });

    return {
      message: 'Bình luận thành công',
      comment: this.toCommentDto(comment),
    };
  }

  /** Loads a non-deleted post and asserts the caller owns it. */
  private async assertPostOwner(postId: bigint, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    if (post.userId !== BigInt(userId)) {
      throw new ForbiddenException('Bạn không có quyền với bài viết này');
    }
    return post;
  }

  async deletePost(postId: string, userId: string) {
    const id = BigInt(postId);
    await this.assertPostOwner(id, userId);

    await this.prisma.post.update({
      where: { id },
      data: { deletedAt: new Date(), status: PostStatus.DELETED },
    });

    return { id: postId };
  }

  async pinPost(postId: string, userId: string, pinned: boolean) {
    const id = BigInt(postId);
    await this.assertPostOwner(id, userId);

    const post = await this.prisma.post.update({
      where: { id },
      data: { pinnedAt: pinned ? new Date() : null },
      select: POST_SELECT,
    });

    return {
      message: pinned ? 'Ghim bài viết thành công' : 'Bỏ ghim thành công',
      post: this.toPostDto(post, userId),
    };
  }
}
