import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadsService {
  getFileUrl(folder: string, filename: string) {
    return `/uploads/${folder}/${filename}`;
  }
}