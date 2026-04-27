import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    getUsers: jest.Mock;
    getMyProfile: jest.Mock;
    updateMyProfile: jest.Mock;
    updateAvatar: jest.Mock;
    updateCover: jest.Mock;
    getPublicProfile: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      getUsers: jest.fn(),
      getMyProfile: jest.fn(),
      updateMyProfile: jest.fn(),
      updateAvatar: jest.fn(),
      updateCover: jest.fn(),
      getPublicProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get current user profile', () => {
    const req = { user: { sub: '1', email: 'a@gmail.com', role: 'USER' } } as any;
    usersService.getMyProfile.mockReturnValue({ user: { id: '1' } });

    expect(controller.getMyProfile(req)).toEqual({ user: { id: '1' } });
    expect(usersService.getMyProfile).toHaveBeenCalledWith('1');
  });

  it('should update current user avatar', () => {
    const req = { user: { sub: '1', email: 'a@gmail.com', role: 'USER' } } as any;
    const file = { filename: 'avatar.jpg' } as Express.Multer.File;
    usersService.updateAvatar.mockReturnValue({ user: { avatarUrl: '/uploads/avatar.jpg' } });

    expect(controller.updateAvatar(req, {}, file)).toEqual({
      user: { avatarUrl: '/uploads/avatar.jpg' },
    });
    expect(usersService.updateAvatar).toHaveBeenCalledWith('1', {}, file);
  });

  it('should get public user profile', () => {
    usersService.getPublicProfile.mockReturnValue({ user: { id: '2' } });

    expect(controller.getPublicProfile('2')).toEqual({ user: { id: '2' } });
    expect(usersService.getPublicProfile).toHaveBeenCalledWith('2');
  });
});
