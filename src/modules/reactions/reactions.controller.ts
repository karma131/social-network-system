import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReactPostDto } from './dto/react-post.dto';
import { ReactionsService } from './reactions.service';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Reactions')
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thả cảm xúc cho bài viết' })
  @Post()
  reactToPost(@Req() req: RequestCoUser, @Body() dto: ReactPostDto) {
    return this.reactionsService.reactToPost(req.user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bỏ cảm xúc khỏi bài viết' })
  @Delete('post/:postId')
  removeReaction(@Req() req: RequestCoUser, @Param('postId') postId: string) {
    return this.reactionsService.removeReaction(req.user.sub, postId);
  }

  @ApiOperation({ summary: 'Lấy danh sách cảm xúc của một bài viết' })
  @Get('post/:postId')
  getReactionsByPost(@Param('postId') postId: string) {
    return this.reactionsService.getReactionsByPost(postId);
  }
}