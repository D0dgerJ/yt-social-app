import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTS = new Set<string>([
  // изображения
  '.jpg', '.jpeg', '.png', /*'.webp',Проблемы совместимости и MIME*/ '.gif', /*'.svg',Проблема: потенциальный XSS (Cross-Site Scripting)*/
  // видео
  '.mp4', '.webm', '.mov', '.mkv', '.avi',
  // аудио
  '.mp3', '.ogg', '.wav', '.m4a',
  // документы/таблицы/текст
  '.pdf', '.txt', '.csv',
  '.doc', '.docx',
  '.xls', '.xlsx',
  // архивы
  '.zip', '.rar', '.7z',
]);

const ALLOWED_MIME = new Set<string>([
  // images
  'image/jpeg', 'image/png', /*'image/webp',Проблемы совместимости и MIME*/ 'image/gif', /*'image/svg+xml',Проблема: потенциальный XSS (Cross-Site Scripting)*/
  // video
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo',
  // audio
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4',
  // docs/text
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // archives
  'application/zip', 'application/x-7z-compressed', 'application/x-rar-compressed',
]);

const BLOCKED_EXTS = new Set<string>([
  '.exe', '.msi', '.dll', '.com', '.scr',
  '.bat', '.cmd', '.sh', '.ps1',
  '.js', '.mjs', '.jar', '.vbs',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (BLOCKED_EXTS.has(ext)) {
    cb(new Error('❌ Недопустимый тип файла (заблокированное расширение)'));
    return;
  }
  if (!ALLOWED_EXTS.has(ext)) {
    cb(new Error('❌ Расширение файла не разрешено'));
    return;
  }
  if (!ALLOWED_MIME.has(mime)) {
    cb(new Error('❌ MIME-тип файла не разрешён'));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
});
