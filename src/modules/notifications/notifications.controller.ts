import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Lấy danh sách thông báo của tôi' })
  @Get()
  getMyNotifications(@Req() req: RequestCoUser) {
    return this.notificationsService.getMyNotifications(req.user.sub);
  }

  @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc' })
  @Get('unread-count')
  getUnreadCount(@Req() req: RequestCoUser) {
    return this.notificationsService.getUnreadCount(req.user.sub);
  }

  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc' })
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  @Patch('read-all')
  markAllAsRead(@Req() req: RequestCoUser) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }
}