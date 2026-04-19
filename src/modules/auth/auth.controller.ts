import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

import { Roles } from './decorators/roles.decorator';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto
  ) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto
  ) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshToken(
    @Body() refreshDto: RefreshTokenDto
  ) {
    return this.authService.refreshToken(refreshDto);
  }

  @Post('logout')
  async logout(
    @Body() refreshDto: RefreshTokenDto
  ) {
    return this.authService.logout(refreshDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(
    @Req() req: any
  ) {
    return this.authService.getCurrentUser(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  adminOnly() {
    return {
      message: 'Admin access granted'
    };
  }

}
