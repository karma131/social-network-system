import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { multerDiskStorage } from '../uploads/multer.config';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateCoverDto } from './dto/update-cover.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileExtendedDto } from './dto/update-profile-extended.dto';
import { UsersService } from './users.service';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lay danh sach nguoi dung - admin' })
  @Get()
  getUsers(@Query() query: QueryUsersDto) {
    return this.usersService.getUsers(query);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lay thong tin tai khoan hien tai' })
  @Get('me')
  getMyProfile(@Req() req: RequestCoUser) {
    return this.usersService.getMyProfile(req.user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cap nhat profile hien tai' })
  @Patch('me')
  updateMyProfile(
    @Req() req: RequestCoUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateMyProfile(req.user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lay extended profile cua user hien tai' })
  @Get('me/profile')
  getMyExtendedProfile(@Req() req: RequestCoUser) {
    return this.usersService.getMyExtendedProfile(req.user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cap nhat extended profile cua user hien tai' })
  @Patch('me/profile')
  updateMyExtendedProfile(
    @Req() req: RequestCoUser,
    @Body() dto: UpdateProfileExtendedDto,
  ) {
    return this.usersService.updateMyExtendedProfile(req.user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cap nhat avatar bang URL hoac file upload' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatarUrl: {
          type: 'string',
          example: 'https://example.com/avatar.jpg',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('file', { storage: multerDiskStorage }))
  updateAvatar(
    @Req() req: RequestCoUser,
    @Body() dto: UpdateAvatarDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(req.user.sub, dto, file);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cap nhat anh bia bang URL hoac file upload' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        coverUrl: {
          type: 'string',
          example: 'https://example.com/cover.jpg',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Patch('me/cover')
  @UseInterceptors(FileInterceptor('file', { storage: multerDiskStorage }))
  updateCover(
    @Req() req: RequestCoUser,
    @Body() dto: UpdateCoverDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.updateCover(req.user.sub, dto, file);
  }

  @ApiOperation({ summary: 'Lay public profile cua nguoi dung khac' })
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
