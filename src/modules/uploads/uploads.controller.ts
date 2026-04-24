import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadType } from '@prisma/client';
import { UploadsService } from './uploads.service';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @ApiOperation({ summary: 'Tải lên một file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        uploadType: {
          type: 'string',
          enum: ['AVATAR', 'COVER', 'POST_IMAGE', 'CHAT_IMAGE', 'OTHER'],
          example: 'OTHER',
        },
      },
    },
  })
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  uploadSingle(
    @Req() req: RequestCoUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('uploadType') uploadType?: UploadType,
  ) {
    return this.uploadsService.saveFile(
      req.user.sub,
      file,
      uploadType || UploadType.OTHER,
    );
  }

  @ApiOperation({ summary: 'Tải lên nhiều file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        uploadType: {
          type: 'string',
          enum: ['AVATAR', 'COVER', 'POST_IMAGE', 'CHAT_IMAGE', 'OTHER'],
          example: 'POST_IMAGE',
        },
      },
    },
  })
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadMultiple(
    @Req() req: RequestCoUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('uploadType') uploadType?: UploadType,
  ) {
    return this.uploadsService.saveManyFiles(
      req.user.sub,
      files,
      uploadType || UploadType.OTHER,
    );
  }

  @ApiOperation({ summary: 'Lấy danh sách file của tôi' })
  @Get('me')
  getMyUploads(@Req() req: RequestCoUser) {
    return this.uploadsService.getMyUploads(req.user.sub);
  }

  @ApiOperation({ summary: 'Xóa file của tôi' })
  @Delete(':id')
  deleteUpload(@Req() req: RequestCoUser, @Param('id') id: string) {
    return this.uploadsService.deleteUpload(req.user.sub, id);
  }
}