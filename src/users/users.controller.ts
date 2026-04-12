import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  getMe(@Req() req: any) {
    return this.usersService.getMe(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  updateMe(@Req() req: any, @Body() body: UpdateUserDto) {
    return this.usersService.updateMe(req.user.id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin user theo id' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }
}