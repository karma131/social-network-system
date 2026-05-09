import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
  Query,
  Body,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { FilterPostDto } from './dto/filter-post.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { ReportPostDto } from './dto/report-post.dto';

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

  @ApiOperation({ summary: 'Phê duyệt bài viết' })
@Patch('posts/:id/approve')
approvePost(@Param('id') id: string, @Req() req: RequestCoUser) {
  return this.adminService.approvePost(req.user.sub, id);
}

@ApiOperation({ summary: 'Lọc và sắp xếp bài viết' })
@Get('posts')
getPosts(@Query() query: FilterPostDto) {
  return this.adminService.getPosts(query);
}

@ApiOperation({ summary: 'Báo cáo người dùng' })
@Get('reports/users')
getUserReport(@Query() query: ReportUserDto) {
  return this.adminService.getUserReport(query);
}

@ApiOperation({ summary: 'Báo cáo bài viết' })
@Get('reports/posts')
getPostReport(@Query() query: ReportPostDto) {
  return this.adminService.getPostReport(query);
}

  @ApiOperation({ summary: 'Lấy lịch sử thao tác admin' })
  @Get('logs')
  getLogs() {
    return this.adminService.getAdminLogs();
  }
  @ApiOperation({ summary: 'Cập nhật quyền người dùng' })
@Patch('roles/:id')
updateRole(
  @Param('id') id: string,
  @Body() dto: UpdateRoleDto,
  @Req() req: RequestCoUser,
) {
  return this.adminService.updateUserRole(
    req.user.sub,
    id,
    dto.role,
  );
}

  @ApiOperation({ summary: 'Xem danh sách người dùng' })
@Get('users')
getUsers(
  @Query('page') page: string,
  @Query('limit') limit: string,
  @Query('search') search: string,
) {
  return this.adminService.getUsers({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    search: search || '',
  });
}
@ApiOperation({ summary: 'Tạo admin mới' })
@Post('users')
createAdmin(
  @Body() dto: CreateAdminDto,
  @Req() req: RequestCoUser,
) {
  return this.adminService.createAdmin(req.user.sub, dto);
}
}
