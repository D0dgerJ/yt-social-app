import { Request, Response } from "express";
import { upload } from "../upload/uploadFile.ts";
import { uploadToStorage } from "../../../utils/uploadToStorage.ts";
import fs from "fs/promises";

export const uploadMediaHandler = [
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Файл не был загружен" });
      return;
    }

    try {
      const url = await uploadToStorage(file);

      res.json({
        success: true,
        url,
        name: file.originalname,
        mime: file.mimetype,
      });
    } catch (err) {
      console.error("Ошибка при загрузке файла:", err);
      res.status(500).json({ error: "Ошибка при загрузке файла" });
    } finally {
      if (file?.path) {
        try { await fs.unlink(file.path); } catch {}
      }
    }
  },
];
