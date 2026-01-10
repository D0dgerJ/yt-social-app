/** ✅ Разрешённые MIME-типы изображений */
export const IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
];

/** ✅ Разрешённые MIME-типы видео */
export const VIDEO_MIME = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // .mov
];

/** ✅ Разрешённые MIME-типы файлов (документы, архивы, текст) */
export const FILE_MIME = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  // MS Office / OpenOffice
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

/** 💾 Лимиты (в мегабайтах) */
export const MAX_IMAGE_MB = 10;   // 10 MB
export const MAX_VIDEO_MB = 150;  // 150 MB
export const MAX_FILE_MB  = 25;   // 25 MB

/** 📦 Максимальное количество файлов за раз */
export const MAX_TOTAL_FILES = 10;

/** 🔢 Перевод байтов в мегабайты */
export function bytesToMB(b: number) {
  return b / (1024 * 1024);
}

/** 🧩 Удобная утилита для проверки MIME-типа */
export function isAllowedMime(type: string): boolean {
  return (
    IMAGE_MIME.includes(type) ||
    VIDEO_MIME.includes(type) ||
    FILE_MIME.includes(type)
  );
}

/** 🏷️ Доп. справочник для UI (необязательно использовать) */
export const MIME_LABELS: Record<string, string> = {
  "image/jpeg": "JPEG изображение",
  "image/png": "PNG изображение",
  "image/webp": "WEBP изображение",
  "image/gif": "GIF изображение",
  "image/avif": "AVIF изображение",
  "image/heic": "HEIC изображение",

  "video/mp4": "MP4 видео",
  "video/webm": "WEBM видео",
  "video/ogg": "OGG видео",
  "video/quicktime": "MOV видео",

  "application/pdf": "PDF документ",
  "application/zip": "ZIP архив",
  "text/plain": "Текстовый файл",
  "application/msword": "DOC документ",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX документ",
  "application/vnd.ms-excel": "XLS документ",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX документ",
  "application/vnd.ms-powerpoint": "PPT презентация",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX презентация",
};
