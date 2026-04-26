import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerDiskStorage = diskStorage({
  destination: process.env.UPLOAD_DIR || 'uploads',
  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
    callback(null, fileName);
  },
});