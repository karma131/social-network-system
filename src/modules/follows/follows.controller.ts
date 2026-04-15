import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Theo dõi người dùng khác' })
  @ApiResponse({ status: 201, description: 'Theo dõi thành công' })
  followUser(@Req() req: any, @Param('userId', ParseIntPipe) userId: number) {
    return this.followsService.followUser(req.user.id, userId);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bỏ theo dõi người dùng' })
  @ApiResponse({ status: 200, description: 'Bỏ theo dõi thành công' })
  unfollowUser(@Req() req: any, @Param('userId', ParseIntPipe) userId: number) {
    return this.followsService.unfollowUser(req.user.id, userId);
  }

  @Get('followers/:userId')
  @ApiOperation({ summary: 'Lấy danh sách follower' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách follower thành công' })
  getFollowers(@Param('userId', ParseIntPipe) userId: number) {
    return this.followsService.getFollowers(userId);
  }

  @Get('following/:userId')
  @ApiOperation({ summary: 'Lấy danh sách đang theo dõi' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách following thành công' })
  getFollowing(@Param('userId', ParseIntPipe) userId: number) {
    return this.followsService.getFollowing(userId);
  }
}