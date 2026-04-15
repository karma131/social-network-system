import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadsService } from './uploads.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

function createMulterOptions(folder: string) {
  return {
    storage: diskStorage({
      destination: `./uploads/${folder}`,
      filename: (req, file, callback) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
        callback(null, uniqueName);
      },
    }),
  };
}

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Upload ảnh avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Upload avatar thành công' })
  @UseInterceptors(FileInterceptor('file', createMulterOptions('avatars')))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return {
      message: 'Upload avatar successful',
      fileName: file.filename,
      url: this.uploadsService.getFileUrl('avatars', file.filename),
    };
  }

  @Post('cover')
  @ApiOperation({ summary: 'Upload ảnh bìa' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Upload cover thành công' })
  @UseInterceptors(FileInterceptor('file', createMulterOptions('covers')))
  uploadCover(@UploadedFile() file: Express.Multer.File) {
    return {
      message: 'Upload cover successful',
      fileName: file.filename,
      url: this.uploadsService.getFileUrl('covers', file.filename),
    };
  }

  @Post('post-image')
  @ApiOperation({ summary: 'Upload ảnh bài viết' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Upload ảnh bài viết thành công' })
  @UseInterceptors(FileInterceptor('file', createMulterOptions('posts')))
  uploadPostImage(@UploadedFile() file: Express.Multer.File) {
    return {
      message: 'Upload post image successful',
      fileName: file.filename,
      url: this.uploadsService.getFileUrl('posts', file.filename),
    };
  }
}