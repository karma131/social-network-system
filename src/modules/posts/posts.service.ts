import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus, PostVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(userId: string, dto: CreatePostDto) {
    if (!dto.content?.trim()) {
      throw new BadRequestException('Nội dung bài viết không được để trống');
    }

    const post = await this.prisma.post.create({
      data: {
        userId: BigInt(userId),
        content: dto.content.trim(),
        visibility: dto.visibility,
        status: PostStatus.PUBLISHED,
      },
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
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Tạo bài viết thành công',
      post: {
        ...post,
        id: post.id.toString(),
        user: {
          ...post.user,
          id: post.user.id.toString(),
        },
      },
    };
  }

  async getPublicPosts() {
    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
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
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Lấy danh sách bài viết thành công',
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

  async getMyPosts(userId: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        userId: BigInt(userId),
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
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
      },
    });

    return {
      message: 'Lấy bài viết của tôi thành công',
      posts: posts.map((post) => ({
        ...post,
        id: post.id.toString(),
      })),
    };
  }

  async getPostById(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: BigInt(postId),
        deletedAt: null,
      },
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
            fullName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    return {
      message: 'Lấy chi tiết bài viết thành công',
      post: {
        ...post,
        id: post.id.toString(),
        user: {
          ...post.user,
          id: post.user.id.toString(),
        },
      },
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

    const updatedPost = await this.prisma.post.update({
      where: {
        id: BigInt(postId),
      },
      data: {
        content: dto.content !== undefined ? dto.content.trim() : undefined,
        visibility: dto.visibility,
      },
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
      },
    });

    return {
      message: 'Cập nhật bài viết thành công',
      post: {
        ...updatedPost,
        id: updatedPost.id.toString(),
      },
    };
  }
}