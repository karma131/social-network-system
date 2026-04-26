import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Khóa người dùng' })
  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.adminService.banUser(req.user.sub, id);
  }

  @ApiOperation({ summary: 'Mở khóa người dùng' })
  @Patch('users/:id/unban')
  unbanUser(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.adminService.unbanUser(req.user.sub, id);
  }

  @ApiOperation({ summary: 'Ẩn bài viết' })
  @Patch('posts/:id/hide')
  hidePost(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.adminService.hidePost(req.user.sub, id);
  }

  @ApiOperation({ summary: 'Xóa mềm bài viết' })
  @Delete('posts/:id')
  deletePost(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.adminService.deletePost(req.user.sub, id);
  }

  @ApiOperation({ summary: 'Lấy lịch sử thao tác admin' })
  @Get('logs')
  getLogs() {
    return this.adminService.getAdminLogs();
  }
}