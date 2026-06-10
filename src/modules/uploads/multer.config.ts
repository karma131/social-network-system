import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';

export const multerDiskStorage = diskStorage({
  destination: (_req, _file, callback) => {
    const dir = process.env.UPLOAD_DIR || 'uploads';
    mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },
  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
    callback(null, fileName);
  },
});

export const multerCloudStorage = memoryStorage();

export const multerCloudinaryOptions = {
  storage: multerCloudStorage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_FILE_SIZE_MB || 100) * 1024 * 1024,
  },
};
