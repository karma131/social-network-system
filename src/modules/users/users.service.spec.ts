import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };

  const privateUser = {
    id: BigInt(1),
    name: 'Nguyen Van A',
    email: 'a@gmail.com',
    avatarUrl: null,
    coverUrl: null,
    bio: null,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date('2026-04-28T00:00:00.000Z'),
    updatedAt: new Date('2026-04-28T00:00:00.000Z'),
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get current user profile without passwordHash', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: BigInt(1), status: UserStatus.ACTIVE, deletedAt: null })
      .mockResolvedValueOnce(privateUser);

    const result = await service.getMyProfile('1');

    expect(result.data).toMatchObject({
      id: '1',
      name: 'Nguyen Van A',
      email: 'a@gmail.com',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });
    expect(result.data).not.toHaveProperty('passwordHash');
  });

  it('should update profile full name and bio', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: BigInt(1),
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    prisma.user.update.mockResolvedValue({
      ...privateUser,
      name: 'Nguyen Van B',
      bio: 'Hello',
    });

    const result = await service.updateMyProfile('1', {
      name: ' Nguyen Van B ',
      bio: ' Hello ',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: BigInt(1) },
      data: {
        name: 'Nguyen Van B',
        bio: 'Hello',
      },
      select: expect.any(Object),
    });
    expect(result.user.name).toBe('Nguyen Van B');
    expect(result.user.bio).toBe('Hello');
  });

  it('should update avatar from uploaded file', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: BigInt(1),
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    prisma.user.update.mockResolvedValue({
      ...privateUser,
      avatarUrl: '/uploads/avatar.jpg',
    });

    const result = await service.updateAvatar(
      '1',
      {},
      { filename: 'avatar.jpg' } as Express.Multer.File,
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: BigInt(1) },
      data: { avatarUrl: '/uploads/avatar.jpg' },
      select: expect.any(Object),
    });
    expect(result.user.avatarUrl).toBe('/uploads/avatar.jpg');
  });

  it('should update cover from url', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: BigInt(1),
      status: UserStatus.ACTIVE,
      deletedAt: null,
    });
    prisma.user.update.mockResolvedValue({
      ...privateUser,
      coverUrl: 'https://example.com/cover.jpg',
    });

    const result = await service.updateCover('1', {
      coverUrl: ' https://example.com/cover.jpg ',
    });

    expect(result.user.coverUrl).toBe('https://example.com/cover.jpg');
  });

  it('should get public profile without email and passwordHash', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: BigInt(2),
      name: 'Public User',
      avatarUrl: null,
      coverUrl: null,
      bio: 'Public bio',
    });

    const result = await service.getPublicProfile('2');

    expect(result.user).toEqual({
      id: '2',
      name: 'Public User',
      avatarUrl: null,
      coverUrl: null,
      bio: 'Public bio',
    });
    expect(result.user).not.toHaveProperty('email');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('should reject locked or banned user actions', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: BigInt(1),
      status: UserStatus.LOCKED,
      deletedAt: null,
    });

    await expect(service.getMyProfile('1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should throw not found for missing public profile', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.getPublicProfile('999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should query users with pagination', async () => {
    prisma.user.findMany.mockResolvedValue([privateUser]);
    prisma.user.count.mockResolvedValue(1);

    const result = await service.getUsers({
      page: 1,
      limit: 10,
      search: 'a',
    });

    expect(result.users).toHaveLength(1);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });
});
