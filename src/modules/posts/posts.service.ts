import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: number, data: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        content: data.content,
        imageUrl: data.imageUrl,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return {
      message: 'Create post successful',
      post,
    };
  }

  async getAllPosts() {
    const posts = await this.prisma.post.findMany({
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
      },
    });

    return {
      message: 'Get posts successful',
      posts,
    };
  }

  async getPostById(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      message: 'Get post successful',
      post,
    };
  }

  async updatePost(userId: number, postId: number, data: UpdatePostDto) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    if (existingPost.authorId !== userId) {
      throw new ForbiddenException('You can only update your own post');
    }

    const post = await this.prisma.post.update({
      where: { id: postId },
      data: {
        content: data.content,
        imageUrl: data.imageUrl,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return {
      message: 'Update post successful',
      post,
    };
  }

  async deletePost(userId: number, postId: number) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    if (existingPost.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own post');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return {
      message: 'Delete post successful',
    };
  }
}