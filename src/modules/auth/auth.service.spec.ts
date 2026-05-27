import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    refreshToken: {
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user with normalized email and hashed password', async () => {
    process.env.JWT_ACCESS_SECRET = 'access-secret';
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    prisma.user.findUnique.mockResolvedValue(null);
    jwtService.signAsync.mockResolvedValue('access-token');
    prisma.user.create.mockResolvedValue({
      id: BigInt(1),
      name: 'Nguyen Van A',
      email: 'a@gmail.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt,
    });
    bcryptMock.hash.mockResolvedValue('hashed-password' as never);

    const result = await service.register({
      name: ' Nguyen Van A ',
      email: ' A@GMAIL.COM ',
      password: '123456',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@gmail.com' },
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Nguyen Van A',
        email: 'a@gmail.com',
        passwordHash: 'hashed-password',
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
    expect(result.data.user.id).toBe('1');
  });

  it('should reject duplicated email during registration', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: BigInt(1) });

    await expect(
      service.register({
        name: 'Nguyen Van A',
        email: 'a@gmail.com',
        password: '123456',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should login active user and persist hashed refresh token', async () => {
    process.env.JWT_ACCESS_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';

    prisma.user.findUnique.mockResolvedValue({
      id: BigInt(1),
      name: 'Nguyen Van A',
      email: 'a@gmail.com',
      passwordHash: 'stored-hash',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    bcryptMock.compare.mockResolvedValue(true as never);
    bcryptMock.hash.mockResolvedValue('hashed-refresh' as never);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    prisma.user.update.mockResolvedValue({} as never);

    const result = await service.login(
      {
        email: ' A@GMAIL.COM ',
        password: '123456',
      },
      'Swagger UI',
      '127.0.0.1',
    );

    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      {
        sub: '1',
        email: 'a@gmail.com',
        role: UserRole.USER,
      },
      {
        secret: 'access-secret',
        expiresIn: '15m',
      },
    );
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: BigInt(1),
        tokenHash: 'hashed-refresh',
        userAgent: 'Swagger UI',
        ipAddress: '127.0.0.1',
      }),
    });
    expect(result.data.token).toBe('access-token');
    expect(result.data.refreshToken).toBe('refresh-token');
    expect(result.data.user.id).toBe('1');
  });

  it('should reject login with wrong password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: BigInt(1),
      email: 'a@gmail.com',
      passwordHash: 'stored-hash',
      status: UserStatus.ACTIVE,
    });
    bcryptMock.compare.mockResolvedValue(false as never);

    await expect(
      service.login({
        email: 'a@gmail.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
