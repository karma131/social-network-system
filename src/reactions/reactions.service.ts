import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  async reactToPost(userId: number, data: CreateReactionDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: data.postId,
        },
      },
    });

    if (existingReaction) {
      const updatedReaction = await this.prisma.reaction.update({
        where: { id: existingReaction.id },
        data: { type: data.type as any },
      });

      return {
        message: 'Reaction updated successfully',
        reaction: updatedReaction,
      };
    }

    const reaction = await this.prisma.reaction.create({
      data: {
        userId,
        postId: data.postId,
        type: data.type as any,
      },
    });

    return {
      message: 'Reaction created successfully',
      reaction,
    };
  }

  async removeReaction(userId: number, postId: number) {
    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!existingReaction) {
      throw new BadRequestException('Reaction not found');
    }

    await this.prisma.reaction.delete({
      where: { id: existingReaction.id },
    });

    return {
      message: 'Reaction removed successfully',
    };
  }

  async countReactions(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const total = await this.prisma.reaction.count({
      where: { postId },
    });

    const byType = await this.prisma.reaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: {
        type: true,
      },
    });

    return {
      message: 'Count reactions successful',
      total,
      byType,
    };
  }
}