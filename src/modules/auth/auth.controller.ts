import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

// Nếu sau này bạn có guard thật thì bỏ comment:
// import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

  // POST /auth/register
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto
  ) {
    return this.authService.register(registerDto);
  }

  // POST /auth/login
  @Post('login')
  async login(
    @Body() loginDto: LoginDto
  ) {
    return this.authService.login(loginDto);
  }

  // POST /auth/refresh
  @Post('refresh')
  async refreshToken(
    @Body() refreshDto: RefreshTokenDto
  ) {
    return this.authService.refreshToken(refreshDto);
  }

  // POST /auth/logout
  @Post('logout')
  async logout(
    @Body() refreshDto: RefreshTokenDto
  ) {
    return this.authService.logout(refreshDto);
  }

  // GET /auth/me
  // Khi có JwtAuthGuard thật thì mở UseGuards ra
  // @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(
    @Req() req: any
  ) {
    return this.authService.getCurrentUser(
      req.user
    );
  }
}
