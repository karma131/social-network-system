import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UploadType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Express } from 'express';
@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveFile(
    userId: string,
    file: Express.Multer.File,
    uploadType: UploadType = UploadType.OTHER,
  ) {
    if (!file) {
      throw new BadRequestException('Không có file được tải lên');
    }

    const fileUrl = `/${process.env.UPLOAD_DIR || 'uploads'}/${file.filename}`;

    const upload = await this.prisma.upload.create({
      data: {
        userId: BigInt(userId),
        fileUrl,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
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
        const fileUrl = `/${process.env.UPLOAD_DIR || 'uploads'}/${file.filename}`;

        return this.prisma.upload.create({
          data: {
            userId: BigInt(userId),
            fileUrl,
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileSize: BigInt(file.size),
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