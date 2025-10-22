import { Request, Response } from "express";

function getBaseUrl(req: Request) {
  const proto =
    (req.headers["x-forwarded-proto"] as string) ||
    req.protocol;
  const host =
    (req.headers["x-forwarded-host"] as string) ||
    req.get("host");
  return `${proto}://${host}`;
}

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
    const base = getBaseUrl(req);

    const results = list.map((f) => ({
      url: `${base}/uploads/${f.filename}`, 
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

  const base = getBaseUrl(req);

  res.json({
    message: "✅ Файл успешно загружен",
    fileUrl: `${base}/uploads/${f.filename}`, 
    fileName: f.originalname,
    fileSize: f.size,
    fileType: f.mimetype,
  });
};
