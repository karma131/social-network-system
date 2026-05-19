import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UploadType } from '@prisma/client';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import { Express } from 'express';

@Injectable()
export class CloudinaryService {
  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadType: UploadType = UploadType.OTHER,
  ) {
    this.ensureConfigured();

    if (!file?.buffer?.length) {
      throw new BadRequestException('Khong co du lieu file de upload');
    }

    const folder = this.getFolder(uploadType);

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            reject(
              new InternalServerErrorException(
                `Cloudinary upload failed: ${error.message}`,
              ),
            );
            return;
          }

          if (!result) {
            reject(
              new InternalServerErrorException(
                'Cloudinary khong tra ve ket qua',
              ),
            );
            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  private ensureConfigured() {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new InternalServerErrorException(
        'Thieu cau hinh Cloudinary trong file .env',
      );
    }
  }

  private getFolder(uploadType: UploadType) {
    const rootFolder = process.env.CLOUDINARY_FOLDER || 'social-network';
    return `${rootFolder}/${uploadType.toLowerCase()}`;
  }
}
