// БЕЛЫЕ СПИСКИ МЕДИА
export const IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
];

export const VIDEO_MIME = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // .mov
];

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

// ЛИМИТЫ 
export const MAX_IMAGE_MB = 10;   // 10 MB
export const MAX_VIDEO_MB = 150;  // 150 MB
export const MAX_FILE_MB  = 25;   // 25 MB

export const MAX_TOTAL_FILES = 10;

export function bytesToMB(b: number) {
  return b / (1024 * 1024);
}
