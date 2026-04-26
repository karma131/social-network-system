import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetMyFeedDto } from './dto/get-my-feed.dto';
import { FeedsService } from './feeds.service';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Feeds')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('feeds')
export class FeedsController {
  constructor(private readonly feedsService: FeedsService) {}

  @ApiOperation({ summary: 'Lấy bảng tin của tôi' })
  @Get('me')
  getMyFeed(@Req() req: RequestCoUser, @Query() query: GetMyFeedDto) {
    return this.feedsService.getMyFeed(req.user.sub, query);
  }
}