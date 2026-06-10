import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ResendVerificationDto } from './dto/resend-verification.dto';

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

const TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    if (result?.data?.token) {
      res.cookie('token', result.data.token, TOKEN_COOKIE_OPTIONS);
    }
    return result;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    const result = await this.authService.login(dto, userAgent, ipAddress);
    if (result?.data?.token) {
      res.cookie('token', result.data.token, TOKEN_COOKIE_OPTIONS);
    }
    return result;
  }

  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Thieu refresh token');
    }

    const result = await this.authService.refreshToken(dto.refreshToken);
    if (result?.accessToken) {
      res.cookie('token', result.accessToken, TOKEN_COOKIE_OPTIONS);
    }
    return result;
  }

  @Post('logout')
  async logout(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Thieu refresh token');
    }

    const result = await this.authService.logout(dto.refreshToken);
    res.clearCookie('token', { path: '/' });
    return result;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.sub);
  }

  @Get('verify-email/:token')
  verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }
}
