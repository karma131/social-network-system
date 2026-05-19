import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UploadType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Express } from 'express';
import { CloudinaryService } from './cloudinary.service';
@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async saveFile(
    userId: string,
    file: Express.Multer.File,
    uploadType: UploadType = UploadType.OTHER,
  ) {
    if (!file) {
      throw new BadRequestException('Không có file được tải lên');
    }

    const uploadedFile = await this.cloudinaryService.uploadFile(
      file,
      uploadType,
    );

    const upload = await this.prisma.upload.create({
      data: {
        userId: BigInt(userId),
        fileUrl: uploadedFile.secure_url,
        fileName: file.originalname,
        mimeType: file.mimetype || uploadedFile.resource_type,
        fileSize: BigInt(uploadedFile.bytes || file.size),
        uploadType,
      },
      select: {
        id: true,
        userId: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        uploadType: true,
        createdAt: true,
      },
    });

    return {
      message: 'Tải file lên thành công',
      upload: {
        ...upload,
        id: upload.id.toString(),
        userId: upload.userId.toString(),
        fileSize: upload.fileSize ? upload.fileSize.toString() : null,
      },
    };
  }

  async saveManyFiles(
    userId: string,
    files: Express.Multer.File[],
    uploadType: UploadType = UploadType.OTHER,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file được tải lên');
    }

    const createdUploads = await Promise.all(
      files.map(async (file) => {
        const uploadedFile = await this.cloudinaryService.uploadFile(
          file,
          uploadType,
        );

        return this.prisma.upload.create({
          data: {
            userId: BigInt(userId),
            fileUrl: uploadedFile.secure_url,
            fileName: file.originalname,
            mimeType: file.mimetype || uploadedFile.resource_type,
            fileSize: BigInt(uploadedFile.bytes || file.size),
            uploadType,
          },
          select: {
            id: true,
            userId: true,
            fileUrl: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            uploadType: true,
            createdAt: true,
          },
        });
      }),
    );

    return {
      message: 'Tải nhiều file lên thành công',
      uploads: createdUploads.map((upload) => ({
        ...upload,
        id: upload.id.toString(),
        userId: upload.userId.toString(),
        fileSize: upload.fileSize ? upload.fileSize.toString() : null,
      })),
    };
  }

  async deleteUpload(userId: string, uploadId: string) {
    const upload = await this.prisma.upload.findUnique({
      where: {
        id: BigInt(uploadId),
      },
    });

    if (!upload) {
      throw new NotFoundException('Không tìm thấy file');
    }

    if (upload.userId !== BigInt(userId)) {
      throw new BadRequestException('Bạn không có quyền xóa file này');
    }

    await this.prisma.upload.delete({
      where: {
        id: BigInt(uploadId),
      },
    });

    return {
      message: 'Xóa file thành công',
    };
  }

  async getMyUploads(userId: string) {
    const uploads = await this.prisma.upload.findMany({
      where: {
        userId: BigInt(userId),
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        uploadType: true,
        createdAt: true,
      },
    });

    return {
      message: 'Lấy danh sách file thành công',
      uploads: uploads.map((upload) => ({
        ...upload,
        id: upload.id.toString(),
        userId: upload.userId.toString(),
        fileSize: upload.fileSize ? upload.fileSize.toString() : null,
      })),
    };
  }
}
