import express from "express";
import { upload } from "../../application/use-cases/upload/uploadFile.js";
import { handleUpload } from "../controllers/uploadController.js";
import { uploadLimiter } from "../../infrastructure/middleware/rateLimit.js";
import multer from "multer";

const router = express.Router();

const uploadMiddleware = upload.fields([
  { name: "files", maxCount: 10 },
  { name: "file", maxCount: 1 },
]);

router.post("/", uploadLimiter, (req, res, next) => {
  uploadMiddleware(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // ошибки multer (лимиты)
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "Файл слишком большой (максимум 15MB)",
        });
      }

      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          error: "Слишком много файлов",
        });
      }

      return res.status(400).json({
        error: "Ошибка загрузки файла",
        details: err.message,
      });
    }

    if (err) {
      // наши кастомные ошибки из fileFilter
      return res.status(400).json({
        error: err.message || "Недопустимый файл",
      });
    }

    next();
  });
}, handleUpload);

export default router;