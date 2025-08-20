import { Request, Response } from "express";
import { upload } from "../upload/uploadFile.ts"
import { uploadToStorage } from "../../../utils/uploadToStorage.ts";

/**
 * Обработчик загрузки медиа (изображения, видео, аудио, документы).
 * Поле в форме должно называться "file".
 */
export const uploadMediaHandler = [
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "Файл не был загружен" });
      return;
    }

    try {
      // Отправляем в S3/Spaces или оставляем локально
      const url = await uploadToStorage(file);

      res.json({
        success: true,
        url, // ссылка на файл
        type: file.mimetype, // например, audio/ogg
        originalName: file.originalname,
      });
    } catch (err) {
      console.error("Ошибка при загрузке файла:", err);
      res.status(500).json({ error: "Ошибка при загрузке файла" });
    }
  },
];