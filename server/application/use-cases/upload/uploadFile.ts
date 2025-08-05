import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; // 👈 нужно для __dirname в ESM

// 👇 Эмуляция __dirname для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Папка для загрузок
const uploadDir = path.join(__dirname, '../../../uploads');

// Убедиться, что папка существует
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadDir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    const safeName = `${base}-${timestamp}${ext}`;
    cb(null, safeName);
  },
});

const allowedMimeTypes = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'video/mp4', 'audio/mpeg',
  'application/pdf', 'text/plain', 'application/zip',
];

const allowedExtensions = [
  '.png', '.jpg', '.jpeg', '.webp', '.gif',
  '.mp4', '.mp3',
  '.pdf', '.txt', '.zip',
];

const blockedExtensions = [
  '.exe', '.js', '.bat', '.cmd', '.scr', '.vbs', '.com', '.msi', '.dll',
];

const fileFilter = (_: any, file: Express.Multer.File, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (blockedExtensions.includes(ext)) {
    return cb(new Error('❌ Блокировка опасного расширения файла'), false);
  }

  if (!allowedMimeTypes.includes(mime)) {
    return cb(new Error('❌ MIME-тип не разрешён'), false);
  }

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('❌ Расширение файла не разрешено'), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});
