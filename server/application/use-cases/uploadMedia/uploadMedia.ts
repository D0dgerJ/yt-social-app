import { Request, Response } from "express";
import multer from "multer";
import { uploadToStorage } from "../../../utils/uploadToStorage.ts";

const upload = multer({ dest: "tmp/" }); // локальная временная директория

export const uploadMediaHandler = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Нет файла" });

    try {
      const url = await uploadToStorage(file); // функция для загрузки в S3/Spaces/локально
      res.json({ url });
    } catch (err) {
      res.status(500).json({ error: "Ошибка загрузки" });
    }
  },
];
