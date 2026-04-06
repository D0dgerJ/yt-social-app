import { Request, Response } from "express";
import fs from "fs/promises";

import { upload } from "../upload/uploadFile.js";
import { uploadToStorage } from "../../../utils/uploadToStorage.js";

export const uploadMediaHandler = [
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "Файл не был загружен" });
      return;
    }

    try {
      const uploaded = await uploadToStorage(file);

      res.json({
        success: true,
        url: uploaded.url,
        key: uploaded.key,
        provider: uploaded.provider,
        name: file.originalname,
        mime: file.mimetype,
        size: file.size,
      });
    } catch (err) {
      console.error("Ошибка при загрузке файла:", err);
      res.status(500).json({ error: "Ошибка при загрузке файла" });
    } finally {
      if (file?.path) {
        try {
          await fs.unlink(file.path);
        } catch {}
      }
    }
  },
];