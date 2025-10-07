import { Request, Response } from "express";

export const handleUpload = async (req: Request, res: Response): Promise<void> => {
  const multi = (req.files as Record<string, Express.Multer.File[]>) || {};
  const list: Express.Multer.File[] = [
    ...(Array.isArray(multi.files) ? multi.files : []),
    ...(Array.isArray(multi.file) ? multi.file : []),
    ...(req.file ? [req.file] : []),
  ];

  if (list.length === 0) {
    res.status(400).json({ error: "Файлы не загружены" });
    return;
  }

  try {
    const results = list.map((f) => ({
      url: `/uploads/${f.filename}`, 
      name: f.originalname,
      mime: f.mimetype,
      size: f.size,
    }));

    res.json({ urls: results });
  } catch (e) {
    console.error("❌ Ошибка при загрузке файла(ов):", e);
    res.status(500).json({ error: "Ошибка при загрузке файла(ов)" });
  }
};

export const handleFileUpload = async (req: Request, res: Response): Promise<void> => {
  const f = req.file;
  if (!f) {
    res.status(400).json({ error: "Файл не загружен" });
    return;
  }
  res.json({
    message: "✅ Файл успешно загружен",
    fileUrl: `/uploads/${f.filename}`,
    fileName: f.originalname,
    fileSize: f.size,
    fileType: f.mimetype,
  });
};
