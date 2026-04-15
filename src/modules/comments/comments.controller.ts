import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm bình luận vào bài viết' })
  @ApiResponse({ status: 201, description: 'Thêm bình luận thành công' })
  createComment(@Req() req: any, @Body() body: CreateCommentDto) {
    return this.commentsService.createComment(req.user.id, body);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Lấy danh sách bình luận theo bài viết' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách bình luận thành công' })
  getCommentsByPostId(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.getCommentsByPostId(postId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sửa bình luận' })
  @ApiResponse({ status: 200, description: 'Sửa bình luận thành công' })
  updateComment(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(req.user.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ApiResponse({ status: 200, description: 'Xóa bình luận thành công' })
  deleteComment(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.commentsService.deleteComment(req.user.id, id);
  }
}