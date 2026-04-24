import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại' })
  @Get('me')
  getMyProfile(@Req() req: RequestCoUser) {
    return this.usersService.getMyProfile(req.user.sub);
  }

  @ApiOperation({ summary: 'Cập nhật hồ sơ tài khoản hiện tại' })
  @Patch('me')
  updateMyProfile(
    @Req() req: RequestCoUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateMyProfile(req.user.sub, dto);
  }
}