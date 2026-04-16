import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { LOCAL_UPLOADS_DIR } from "../../../infrastructure/storage/storagePaths.js";

fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_FILES = 10;
const MAX_ORIGINAL_NAME_LENGTH = 180;

const ALLOWED_TYPES: Record<string, string[]> = {
  // images
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".gif": ["image/gif"],

  // video
  ".mp4": ["video/mp4"],
  ".webm": ["video/webm"],
  ".mov": ["video/quicktime"],
  ".mkv": ["video/x-matroska"],
  ".avi": ["video/x-msvideo"],

  // audio
  ".mp3": ["audio/mpeg"],
  ".ogg": ["audio/ogg"],
  ".wav": ["audio/wav"],
  ".m4a": ["audio/mp4", "audio/x-m4a"],
  ".webm-audio": ["audio/webm"],

  // docs / text / spreadsheets
  ".pdf": ["application/pdf"],
  ".txt": ["text/plain"],
  ".csv": ["text/csv"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],

  // archives
  ".zip": ["application/zip"],
  ".rar": ["application/x-rar-compressed"],
  ".7z": ["application/x-7z-compressed"],
};

const BLOCKED_EXTS = new Set<string>([
  ".exe",
  ".msi",
  ".dll",
  ".com",
  ".scr",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".js",
  ".mjs",
  ".cjs",
  ".jar",
  ".vbs",
  ".php",
  ".html",
  ".htm",
  ".svg",
]);

function normalizeMime(m?: string): string {
  return (m || "").toLowerCase().split(";")[0].trim();
}

function getSafeExt(file: Express.Multer.File): string {
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (ext === ".webm") {
    const mime = normalizeMime(file.mimetype);
    if (mime === "audio/webm") return ".webm-audio";
  }

  return ext;
}

function hasSuspiciousFilename(name: string): boolean {
  if (!name || !name.trim()) return true;

  const base = path.basename(name).trim();

  if (base.length === 0) return true;
  if (base.length > MAX_ORIGINAL_NAME_LENGTH) return true;
  if (base.startsWith(".")) return true;
  if (base.includes("\0")) return true;
  if (base.includes("..")) return true;

  return false;
}

function getOriginalExt(name: string): string {
  return path.extname(path.basename(name || "")).toLowerCase();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, LOCAL_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const originalExt = getOriginalExt(file.originalname);

    const safeExt =
      originalExt === ".jpg" ||
      originalExt === ".jpeg" ||
      originalExt === ".png" ||
      originalExt === ".gif" ||
      originalExt === ".mp4" ||
      originalExt === ".webm" ||
      originalExt === ".mov" ||
      originalExt === ".mkv" ||
      originalExt === ".avi" ||
      originalExt === ".mp3" ||
      originalExt === ".ogg" ||
      originalExt === ".wav" ||
      originalExt === ".m4a" ||
      originalExt === ".pdf" ||
      originalExt === ".txt" ||
      originalExt === ".csv" ||
      originalExt === ".doc" ||
      originalExt === ".docx" ||
      originalExt === ".xls" ||
      originalExt === ".xlsx" ||
      originalExt === ".zip" ||
      originalExt === ".rar" ||
      originalExt === ".7z"
        ? originalExt
        : "";

    cb(null, `${randomUUID()}${safeExt}`);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const originalName = file.originalname || "";
  const originalExt = getOriginalExt(originalName);
  const ext = getSafeExt(file);
  const rawMime = file.mimetype || "";
  const mime = normalizeMime(rawMime);

  console.log("UPLOAD DEBUG:", {
    originalname: file.originalname,
    originalExt,
    ext,
    rawMime,
    mime,
  });

  if (hasSuspiciousFilename(originalName)) {
    cb(new Error("❌ Некорректное имя файла"));
    return;
  }

  if (BLOCKED_EXTS.has(originalExt)) {
    cb(new Error("❌ Недопустимый тип файла"));
    return;
  }

  const allowedMimes = ALLOWED_TYPES[ext];

  if (!allowedMimes) {
    cb(new Error(`❌ Расширение файла не разрешено: ${originalExt}`));
    return;
  }

  const isMimeAllowed = allowedMimes.includes(mime);

  const isVideoExt =
    ext === ".mp4" ||
    ext === ".webm" ||
    ext === ".mov" ||
    ext === ".mkv" ||
    ext === ".avi";

  const isAudioExt =
    ext === ".mp3" ||
    ext === ".ogg" ||
    ext === ".wav" ||
    ext === ".m4a" ||
    ext === ".webm-audio";

  const isGenericBinaryMime = mime === "application/octet-stream";

  // Для видео/аудио допускаем fallback по расширению,
  // если браузер прислал generic mime
  if (!isMimeAllowed) {
    if ((isVideoExt || isAudioExt) && isGenericBinaryMime) {
      cb(null, true);
      return;
    }

    cb(new Error(`❌ MIME-тип файла не разрешён: ${rawMime}`));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: MAX_FILES,
    fileSize: MAX_FILE_SIZE,
  },
});