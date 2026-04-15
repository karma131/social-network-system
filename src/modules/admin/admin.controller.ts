import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Lấy danh sách user' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách user thành công' })
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Khóa / mở khóa tài khoản user' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái user thành công' })
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, body);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Lấy danh sách bài viết' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách bài viết thành công' })
  getAllPosts() {
    return this.adminService.getAllPosts();
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Xóa bài viết vi phạm' })
  @ApiResponse({ status: 200, description: 'Xóa bài viết thành công' })
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deletePost(id);
  }
}