import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentStatus, PostStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(userId: string, dto: CreateCommentDto) {
    if (!dto.content.trim()) {
      throw new BadRequestException('Nội dung bình luận không được để trống');
    }

    const post = await this.prisma.post.findFirst({
      where: {
        id: BigInt(dto.postId),
        deletedAt: null,
        status: PostStatus.PUBLISHED,
      },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findFirst({
        where: {
          id: BigInt(dto.parentId),
          deletedAt: null,
        },
      });

      if (!parentComment) {
        throw new NotFoundException('Không tìm thấy bình luận cha');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId: BigInt(dto.postId),
        userId: BigInt(userId),
        parentId: dto.parentId ? BigInt(dto.parentId) : null,
        content: dto.content.trim(),
        status: CommentStatus.ACTIVE,
      },
      select: {
        id: true,
        postId: true,
        userId: true,
        parentId: true,
        content: true,
        status: true,
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

    await this.prisma.post.update({
      where: {
        id: BigInt(dto.postId),
      },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    return {
      message: 'Tạo bình luận thành công',
      comment: {
        ...comment,
        id: comment.id.toString(),
        postId: comment.postId.toString(),
        userId: comment.userId.toString(),
        parentId: comment.parentId ? comment.parentId.toString() : null,
        user: {
          ...comment.user,
          id: comment.user.id.toString(),
        },
      },
    };
  }

  async getCommentsByPost(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: BigInt(postId),
        deletedAt: null,
      },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const comments = await this.prisma.comment.findMany({
      where: {
        postId: BigInt(postId),
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        postId: true,
        userId: true,
        parentId: true,
        content: true,
        status: true,
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
      message: 'Lấy danh sách bình luận thành công',
      comments: comments.map((comment) => ({
        ...comment,
        id: comment.id.toString(),
        postId: comment.postId.toString(),
        userId: comment.userId.toString(),
        parentId: comment.parentId ? comment.parentId.toString() : null,
        user: {
          ...comment.user,
          id: comment.user.id.toString(),
        },
      })),
    };
  }

  async updateComment(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: BigInt(commentId),
      },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    if (comment.userId !== BigInt(userId)) {
      throw new ForbiddenException('Bạn không có quyền sửa bình luận này');
    }

    if (dto.content !== undefined && !dto.content.trim()) {
      throw new BadRequestException('Nội dung bình luận không được để trống');
    }

    const updatedComment = await this.prisma.comment.update({
      where: {
        id: BigInt(commentId),
      },
      data: {
        content: dto.content !== undefined ? dto.content.trim() : undefined,
      },
      select: {
        id: true,
        postId: true,
        userId: true,
        parentId: true,
        content: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Cập nhật bình luận thành công',
      comment: {
        ...updatedComment,
        id: updatedComment.id.toString(),
        postId: updatedComment.postId.toString(),
        userId: updatedComment.userId.toString(),
        parentId: updatedComment.parentId
          ? updatedComment.parentId.toString()
          : null,
      },
    };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: BigInt(commentId),
      },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    if (comment.userId !== BigInt(userId)) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    await this.prisma.comment.update({
      where: {
        id: BigInt(commentId),
      },
      data: {
        deletedAt: new Date(),
        status: CommentStatus.DELETED,
      },
    });

    await this.prisma.post.update({
      where: {
        id: comment.postId,
      },
      data: {
        commentCount: {
          decrement: 1,
        },
      },
    });

    return {
      message: 'Xóa bình luận thành công',
    };
  }
}