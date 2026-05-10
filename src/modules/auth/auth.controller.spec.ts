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

  it('should pass login data, user agent, and ip address to service', () => {
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

    authService.login.mockReturnValue({ accessToken: 'access-token' });

    expect(controller.login(dto, 'Swagger UI', request)).toEqual({
      accessToken: 'access-token',
    });
    expect(authService.login).toHaveBeenCalledWith(
      dto,
      'Swagger UI',
      '127.0.0.1',
    );
  });

  it('should reject refresh when refresh token is missing', () => {
    expect(() => controller.refresh({ refreshToken: '' })).toThrow(
      UnauthorizedException,
    );
  });
});
