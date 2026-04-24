import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo bình luận mới' })
  @Post()
  createComment(@Req() req: RequestCoUser, @Body() dto: CreateCommentDto) {
    return this.commentsService.createComment(req.user.sub, dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách bình luận theo bài viết' })
  @Get('post/:postId')
  getCommentsByPost(@Param('postId') postId: string) {
    return this.commentsService.getCommentsByPost(postId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật bình luận' })
  @Patch(':id')
  updateComment(
    @Param('id') id: string,
    @Req() req: RequestCoUser,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(id, req.user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xóa bình luận' })
  @Delete(':id')
  deleteComment(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.commentsService.deleteComment(id, req.user.sub);
  }
}