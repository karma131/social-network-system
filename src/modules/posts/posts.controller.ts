import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post as HttpPost,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ReactPostDto } from './dto/react-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PostsService } from './posts.service';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

type RequestMaybeUser = Request & {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @HttpPost()
  createPost(@Req() req: RequestCoUser, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(req.user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách bài viết public' })
  @Get()
  getPublicPosts(@Req() req: RequestMaybeUser) {
    return this.postsService.getPublicPosts(req.user?.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách bài viết của tôi' })
  @Get('me')
  getMyPosts(@Req() req: RequestCoUser) {
    return this.postsService.getMyPosts(req.user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy chi tiết một bài viết' })
  @Get(':id')
  getPostById(@Param('id') id: string, @Req() req: RequestMaybeUser) {
    return this.postsService.getPostById(id, req.user?.sub);
  }

  @ApiOperation({ summary: 'Lấy bình luận của bài viết' })
  @Get(':id/comments')
  listComments(@Param('id') id: string) {
    return this.postsService.listComments(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bình luận bài viết' })
  @HttpPost(':id/comments')
  comment(
    @Param('id') id: string,
    @Req() req: RequestCoUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(id, req.user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thả/đổi cảm xúc cho bài viết' })
  @HttpPost(':id/react')
  react(
    @Param('id') id: string,
    @Req() req: RequestCoUser,
    @Body() dto: ReactPostDto,
  ) {
    return this.postsService.reactPost(id, req.user.sub, dto.emoji);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bỏ cảm xúc khỏi bài viết' })
  @Delete(':id/react')
  unreact(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.postsService.unreactPost(id, req.user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @Patch(':id')
  updatePost(
    @Param('id') id: string,
    @Req() req: RequestCoUser,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, req.user.sub, dto);
  }
}