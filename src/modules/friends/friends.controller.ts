import {
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
import { FriendsService } from './friends.service';

type RequestCoUser = Request & {
  user: { sub: string; email: string; role: string };
};

@ApiTags('Friends')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @ApiOperation({ summary: 'My friends + pending requests (both directions)' })
  @Get()
  async snapshot(@Req() req: RequestCoUser) {
    const data = await this.friendsService.snapshot(req.user.sub);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Relationship to one user' })
  @Get('status/:userId')
  async getStatus(
    @Req() req: RequestCoUser,
    @Param('userId') userId: string,
  ) {
    const status = await this.friendsService.getStatus(req.user.sub, userId);
    return { success: true, data: { status } };
  }

  @ApiOperation({ summary: 'Send a friend request' })
  @Post('requests/:userId')
  async sendRequest(
    @Req() req: RequestCoUser,
    @Param('userId') userId: string,
  ) {
    await this.friendsService.sendRequest(req.user.sub, userId);
    return { success: true };
  }

  @ApiOperation({ summary: 'Cancel an outgoing request' })
  @Delete('requests/:userId')
  async cancelRequest(
    @Req() req: RequestCoUser,
    @Param('userId') userId: string,
  ) {
    await this.friendsService.cancelRequest(req.user.sub, userId);
    return { success: true };
  }

  @ApiOperation({ summary: 'Accept an incoming request' })
  @Post('requests/:userId/accept')
  async acceptRequest(
    @Req() req: RequestCoUser,
    @Param('userId') userId: string,
  ) {
    await this.friendsService.acceptRequest(req.user.sub, userId);
    return { success: true };
  }

  @ApiOperation({ summary: 'Reject an incoming request' })
  @Post('requests/:userId/reject')
  async rejectRequest(
    @Req() req: RequestCoUser,
    @Param('userId') userId: string,
  ) {
    await this.friendsService.rejectRequest(req.user.sub, userId);
    return { success: true };
  }

  @ApiOperation({ summary: 'Drop an existing friendship' })
  @Delete(':userId')
  async unfriend(
    @Req() req: RequestCoUser,
    @Param('userId') userId: string,
  ) {
    await this.friendsService.unfriend(req.user.sub, userId);
    return { success: true };
  }
}
