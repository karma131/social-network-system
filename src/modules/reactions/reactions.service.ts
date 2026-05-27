import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReactPostDto } from './dto/react-post.dto';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async reactToPost(userId: string, dto: ReactPostDto) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: BigInt(dto.postId),
        deletedAt: null,
        status: PostStatus.PUBLISHED,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        userId_postId: {
          userId: BigInt(userId),
          postId: BigInt(dto.postId),
        },
      },
    });

    if (!existingReaction) {
      const reaction = await this.prisma.reaction.create({
        data: {
          userId: BigInt(userId),
          postId: BigInt(dto.postId),
          type: dto.type,
        },
        select: {
          id: true,
          userId: true,
          postId: true,
          type: true,
          createdAt: true,
        },
      });

      await this.prisma.post.update({
        where: {
          id: BigInt(dto.postId),
        },
        data: {
          reactionCount: {
            increment: 1,
          },
        },
      });

      return {
        message: 'Thả cảm xúc thành công',
        reaction: {
          ...reaction,
          id: reaction.id.toString(),
          userId: reaction.userId.toString(),
          postId: reaction.postId.toString(),
        },
      };
    }

    const reaction = await this.prisma.reaction.update({
      where: {
        userId_postId: {
          userId: BigInt(userId),
          postId: BigInt(dto.postId),
        },
      },
      data: {
        type: dto.type,
      },
      select: {
        id: true,
        userId: true,
        postId: true,
        type: true,
        createdAt: true,
      },
    });

    return {
      message: 'Cập nhật cảm xúc thành công',
      reaction: {
        ...reaction,
        id: reaction.id.toString(),
        userId: reaction.userId.toString(),
        postId: reaction.postId.toString(),
      },
    };
  }

  async removeReaction(userId: string, postId: string) {
    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        userId_postId: {
          userId: BigInt(userId),
          postId: BigInt(postId),
        },
      },
    });

    if (!existingReaction) {
      throw new NotFoundException('Bạn chưa thả cảm xúc cho bài viết này');
    }

    await this.prisma.reaction.delete({
      where: {
        userId_postId: {
          userId: BigInt(userId),
          postId: BigInt(postId),
        },
      },
    });

    await this.prisma.post.update({
      where: {
        id: BigInt(postId),
      },
      data: {
        reactionCount: {
          decrement: 1,
        },
      },
    });

    return {
      message: 'Bỏ cảm xúc thành công',
    };
  }

  async getReactionsByPost(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: BigInt(postId),
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const reactions = await this.prisma.reaction.findMany({
      where: {
        postId: BigInt(postId),
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        postId: true,
        type: true,
        createdAt: true,
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
      message: 'Lấy danh sách cảm xúc thành công',
      reactions: reactions.map((reaction) => ({
        ...reaction,
        id: reaction.id.toString(),
        userId: reaction.userId.toString(),
        postId: reaction.postId.toString(),
        user: {
          ...reaction.user,
          id: reaction.user.id.toString(),
        },
      })),
    };
  }
}