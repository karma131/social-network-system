import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
<<<<<<< HEAD
  Param,
=======
>>>>>>> origin/main
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
<<<<<<< HEAD
import { ResendVerificationDto } from './dto/resend-verification.dto';
=======
>>>>>>> origin/main

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(
    @Body() dto: LoginDto,
<<<<<<< HEAD
=======
    @Headers('user-agent') userAgent: string,
>>>>>>> origin/main
    @Req() req: Request,
  ) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

<<<<<<< HEAD
    return this.authService.login(dto, ipAddress);
=======
    return this.authService.login(dto, userAgent, ipAddress);
>>>>>>> origin/main
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Thieu refresh token');
    }

    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Thieu refresh token');
    }

    return this.authService.logout(dto.refreshToken);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.sub);
  }
<<<<<<< HEAD
  @Get('verify-email/:token')
verifyEmail(
  @Param('token') token: string,
) {
  return this.authService.verifyEmail(token);
}

@Post('resend-verification')
resendVerification(
  @Body() dto: ResendVerificationDto,
) {
  return this.authService.resendVerification(
    dto.email,
  );
}


=======
>>>>>>> origin/main
}
