import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReactionDto } from './dto/create-reaction.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Reactions')
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thả cảm xúc vào bài viết' })
  @ApiResponse({ status: 201, description: 'Thả cảm xúc thành công' })
  reactToPost(@Req() req: any, @Body() body: CreateReactionDto) {
    return this.reactionsService.reactToPost(req.user.id, body);
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bỏ cảm xúc khỏi bài viết' })
  @ApiResponse({ status: 200, description: 'Bỏ cảm xúc thành công' })
  removeReaction(@Req() req: any, @Param('postId', ParseIntPipe) postId: number) {
    return this.reactionsService.removeReaction(req.user.id, postId);
  }

  @Get('post/:postId/count')
  @ApiOperation({ summary: 'Đếm số lượng tương tác theo bài viết' })
  @ApiResponse({ status: 200, description: 'Đếm tương tác thành công' })
  countReactions(@Param('postId', ParseIntPipe) postId: number) {
    return this.reactionsService.countReactions(postId);
  }
}