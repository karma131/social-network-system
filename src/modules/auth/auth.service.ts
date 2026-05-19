import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from './mail.service';
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
    private readonly mailService: MailService,
  ) {}

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
        fullName: dto.fullName.trim(),
        email,
        passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // tạo token verify
    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = await bcrypt.hash(rawToken, 10);

    // lưu token DB
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ),
      },
    });

    // gửi mail
    await this.mailService.sendVerificationEmail(
      user.email,
      rawToken,
    );

    return {
      message:
        'Đăng ký thành công. Kiểm tra email để xác thực.',
      user: {
        ...user,
        id: user.id.toString(),
      },
    };
  }

  async login(
    dto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không đúng',
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Tài khoản không hoạt động',
      );
    }

    const dungMatKhau = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!dungMatKhau) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không đúng',
      );
    }

    const accessSecret =
      process.env.JWT_ACCESS_SECRET;

    const refreshSecret =
      process.env.JWT_REFRESH_SECRET;

    if (!accessSecret || !refreshSecret) {
      throw new Error(
        'Thiếu cấu hình JWT trong file .env',
      );
    }

    const accessTokenExpiresIn =
      process.env.ACCESS_TOKEN_EXPIRES_IN ||
      '15m';

    const refreshTokenExpiresIn =
      process.env
        .REFRESH_TOKEN_EXPIRES_IN || '7d';

    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
        {
          secret: accessSecret,
          expiresIn:
            accessTokenExpiresIn as any,
        },
      );

    const refreshToken =
      await this.jwtService.signAsync(
        payload,
        {
          secret: refreshSecret,
          expiresIn:
            refreshTokenExpiresIn as any,
        },
      );

    const tokenHash = await bcrypt.hash(
      refreshToken,
      10,
    );

    const refreshExpiresAt = new Date(
      Date.now() +
        7 * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        userAgent:
          userAgent || null,
        ipAddress:
          ipAddress || null,
        expiresAt:
          refreshExpiresAt,
      },
    });

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt:
          new Date(),
      },
    });

    return {
      message:
        'Đăng nhập thành công',
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        fullName:
          user.fullName,
        email:
          user.email,
        role:
          user.role,
        status:
          user.status,
          emailVerified:
           !!user.emailVerifiedAt,
        emailVerifiedAt:
          user.emailVerifiedAt,
      },
    };
  }

  async verifyEmail(
    token: string,
  ) {
    const tokens =
      await this.prisma.emailVerificationToken.findMany(
        {
          where: {
            usedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
        },
      );

    let matched: any = null;

    for (const item of tokens) {
      const ok =
        await bcrypt.compare(
          token,
          item.tokenHash,
        );

      if (ok) {
        matched = item;
        break;
      }
    }

    if (!matched) {
      throw new BadRequestException(
        'Link xác thực không hợp lệ hoặc đã hết hạn',
      );
    }

    await this.prisma.user.update({
      where: {
        id: matched.userId,
      },
      data: {
        emailVerifiedAt:
          new Date(),
      },
    });

    await this.prisma.emailVerificationToken.update(
      {
        where: {
          id: matched.id,
        },
        data: {
          usedAt:
            new Date(),
        },
      },
    );

    return {
      message:
        'Xác thực email thành công',
    };
  }

  async resendVerification(
    email: string,
  ) {
    const user =
      await this.prisma.user.findUnique(
        {
          where: {
            email:
              email
                .trim()
                .toLowerCase(),
          },
        },
      );

    if (!user) {
      throw new BadRequestException(
        'Email không tồn tại',
      );
    }

    if (
      user.emailVerifiedAt
    ) {
      throw new BadRequestException(
        'Email đã xác thực',
      );
    }

    const rawToken =
      crypto
        .randomBytes(32)
        .toString('hex');

    const tokenHash =
      await bcrypt.hash(
        rawToken,
        10,
      );

    await this.prisma.emailVerificationToken.create(
      {
        data: {
          userId:
            user.id,
          tokenHash,
          expiresAt:
            new Date(
              Date.now() +
                24 *
                  60 *
                  60 *
                  1000,
            ),
        },
      },
    );

    await this.mailService.sendVerificationEmail(
      user.email,
      rawToken,
    );

    return {
      message:
        'Đã gửi lại email xác thực',
    };
  }

  async refreshToken(
    refreshToken: string,
  ) {
    const refreshSecret =
      process.env
        .JWT_REFRESH_SECRET;

    const accessSecret =
      process.env
        .JWT_ACCESS_SECRET;

    if (
      !refreshSecret ||
      !accessSecret
    ) {
      throw new Error(
        'Thiếu cấu hình JWT trong file .env',
      );
    }

    const accessTokenExpiresIn =
      process.env.ACCESS_TOKEN_EXPIRES_IN ||
      '15m';

    const refreshTokenExpiresIn =
      process.env
        .REFRESH_TOKEN_EXPIRES_IN || '7d';

    let payload: JwtPayload;

    try {
      payload =
        await this.jwtService.verifyAsync<JwtPayload>(
          refreshToken,
          {
            secret:
              refreshSecret,
          },
        );
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ',
      );
    }

    const userId =
      BigInt(payload.sub);

    const user =
      await this.prisma.user.findUnique(
        {
          where: {
            id:
              userId,
          },
        },
      );

    if (!user) {
      throw new UnauthorizedException(
        'Người dùng không tồn tại',
      );
    }

    const danhSachToken =
      await this.prisma.refreshToken.findMany(
        {
          where: {
            userId,
            revokedAt:
              null,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt:
              'desc',
          },
        },
      );

    let tokenHopLeId:
      | bigint
      | null = null;

    for (const item of danhSachToken) {
      const khop =
        await bcrypt.compare(
          refreshToken,
          item.tokenHash,
        );

      if (khop) {
        tokenHopLeId =
          item.id;
        break;
      }
    }

    if (!tokenHopLeId) {
      throw new UnauthorizedException(
        'Refresh token không được chấp nhận',
      );
    }

    await this.prisma.refreshToken.update(
      {
        where: {
          id:
            tokenHopLeId,
        },
        data: {
          revokedAt:
            new Date(),
        },
      },
    );

    const newPayload: JwtPayload =
      {
        sub:
          user.id.toString(),
        email:
          user.email,
        role:
          user.role,
      };

    const newAccessToken =
      await this.jwtService.signAsync(
        newPayload,
        {
          secret:
            accessSecret,
          expiresIn:
            accessTokenExpiresIn as any,
        },
      );

    const newRefreshToken =
      await this.jwtService.signAsync(
        newPayload,
        {
          secret:
            refreshSecret,
          expiresIn:
            refreshTokenExpiresIn as any,
        },
      );

    const tokenHash =
      await bcrypt.hash(
        newRefreshToken,
        10,
      );

    await this.prisma.refreshToken.create(
      {
        data: {
          userId:
            user.id,
          tokenHash,
          expiresAt:
            new Date(
              Date.now() +
                7 *
                  24 *
                  60 *
                  60 *
                  1000,
            ),
        },
      },
    );

    return {
      message:
        'Làm mới token thành công',
      accessToken:
        newAccessToken,
      refreshToken:
        newRefreshToken,
    };
  }

  async logout(
    refreshToken: string,
  ) {
    const tokens =
      await this.prisma.refreshToken.findMany(
        {
          where: {
            revokedAt:
              null,
          },
        },
      );

    let tokenId:
      | bigint
      | null = null;

    for (const item of tokens) {
      const ok =
        await bcrypt.compare(
          refreshToken,
          item.tokenHash,
        );

      if (ok) {
        tokenId =
          item.id;
        break;
      }
    }

    if (!tokenId) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ',
      );
    }

    await this.prisma.refreshToken.update(
      {
        where: {
          id:
            tokenId,
        },
        data: {
          revokedAt:
            new Date(),
        },
      },
    );

    return {
      message:
        'Đăng xuất thành công',
    };
  }

  async getMe(
    userId: string,
  ) {
    const user =
      await this.prisma.user.findUnique(
        {
          where: {
            id:
              BigInt(
                userId,
              ),
          },
          select: {
            id: true,
            fullName:
              true,
            email:
              true,
            avatarUrl:
              true,
            coverUrl:
              true,
            bio: true,
            role: true,
            status:
              true,
            emailVerifiedAt:
              true,
            lastLoginAt:
              true,
            createdAt:
              true,
          },
        },
      );

    if (!user) {
      throw new UnauthorizedException(
        'Không tìm thấy người dùng',
      );
    }

    return {
      message:
        'Lấy thông tin tài khoản thành công',
      user: {
        ...user,
        id: user.id.toString(),
      },
    };
  }
}
