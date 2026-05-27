import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async signAccessToken(payload: JwtPayload): Promise<string> {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
      throw new Error('Thiếu cấu hình JWT trong file .env');
    }
    const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    return this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessTokenExpiresIn as any,
    });
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const userDaTonTai = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userDaTonTai) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const token = await this.signAccessToken({
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      message: 'Đăng ký thành công',
      data: {
        token,
        user: {
          ...user,
          id: user.id.toString(),
        },
      },
    };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản không hoạt động');
    }

    const dungMatKhau = await bcrypt.compare(dto.password, user.passwordHash);

    if (!dungMatKhau) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new Error('Thiếu cấu hình JWT trong file .env');
    }

    const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessTokenExpiresIn as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshTokenExpiresIn as any,
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    const refreshExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt: refreshExpiresAt,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const accessSecret = process.env.JWT_ACCESS_SECRET;

    if (!refreshSecret || !accessSecret) {
      throw new Error('Thiếu cấu hình JWT trong file .env');
    }

    const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const userId = BigInt(payload.sub);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản không hoạt động');
    }

    const danhSachToken = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let tokenHopLeId: bigint | null = null;

    for (const item of danhSachToken) {
      const khop = await bcrypt.compare(refreshToken, item.tokenHash);
      if (khop) {
        tokenHopLeId = item.id;
        break;
      }
    }

    if (!tokenHopLeId) {
      throw new UnauthorizedException('Refresh token không được chấp nhận');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenHopLeId },
      data: {
        revokedAt: new Date(),
      },
    });

    const newPayload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = await this.jwtService.signAsync(newPayload, {
      secret: accessSecret,
      expiresIn: accessTokenExpiresIn as any,
    });

    const newRefreshToken = await this.jwtService.signAsync(newPayload, {
      secret: refreshSecret,
      expiresIn: refreshTokenExpiresIn as any,
    });

    const tokenHash = await bcrypt.hash(newRefreshToken, 10);

    const refreshExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      message: 'Làm mới token thành công',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const danhSachToken = await this.prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let tokenHopLeId: bigint | null = null;

    for (const item of danhSachToken) {
      const khop = await bcrypt.compare(refreshToken, item.tokenHash);
      if (khop) {
        tokenHopLeId = item.id;
        break;
      }
    }

    if (!tokenHopLeId) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenHopLeId },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Đăng xuất thành công',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: BigInt(userId),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    return {
      success: true,
      message: 'Lấy thông tin tài khoản thành công',
      data: {
        ...user,
        id: user.id.toString(),
      },
    };
  }
}
