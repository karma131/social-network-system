import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Feeds')
@Controller('feeds')
export class FeedsController {
  constructor(private readonly feedsService: FeedsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy newsfeed của người dùng đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Lấy newsfeed thành công' })
  getMyFeed(@Req() req: any) {
    return this.feedsService.getMyFeed(req.user.id);
  }
}