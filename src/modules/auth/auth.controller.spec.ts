import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    refreshToken: jest.Mock;
    logout: jest.Mock;
    getMe: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      getMe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should pass login data, user agent, and ip address to service', async () => {
    const dto = {
      email: 'a@gmail.com',
      password: '123456',
    };
    const request = {
      headers: {
        'x-forwarded-for': '127.0.0.1, 10.0.0.1',
      },
      socket: {
        remoteAddress: '10.0.0.2',
      },
    } as any;
    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

    authService.login.mockResolvedValue({
      data: { token: 'access-token' },
    });

    await expect(controller.login(dto, 'Swagger UI', request, res)).resolves.toEqual({
      data: { token: 'access-token' },
    });
    expect(authService.login).toHaveBeenCalledWith(
      dto,
      'Swagger UI',
      '127.0.0.1',
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      'access-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('should reject refresh when refresh token is missing', async () => {
    const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;
    await expect(
      controller.refresh({ refreshToken: '' }, res),
    ).rejects.toThrow(UnauthorizedException);
  });
});
