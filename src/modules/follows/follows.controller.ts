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
import { FollowUserDto } from './dto/follow-user.dto';
import { FollowsService } from './follows.service';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Theo dõi người dùng' })
  @Post()
  followUser(@Req() req: RequestCoUser, @Body() dto: FollowUserDto) {
    return this.followsService.followUser(req.user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bỏ theo dõi người dùng' })
  @Delete(':userId')
  unfollowUser(@Req() req: RequestCoUser, @Param('userId') userId: string) {
    return this.followsService.unfollowUser(req.user.sub, userId);
  }

  @ApiOperation({ summary: 'Lấy danh sách follower của người dùng' })
  @Get('followers/:userId')
  getFollowers(@Param('userId') userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @ApiOperation({ summary: 'Lấy danh sách đang theo dõi của người dùng' })
  @Get('following/:userId')
  getFollowing(@Param('userId') userId: string) {
    return this.followsService.getFollowing(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Kiểm tra tôi có đang theo dõi người dùng này không' })
  @Get('check/:userId')
  checkFollow(@Req() req: RequestCoUser, @Param('userId') userId: string) {
    return this.followsService.checkFollow(req.user.sub, userId);
  }
}