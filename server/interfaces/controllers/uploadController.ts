import { Request, Response } from 'express';

export const handleFileUpload = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'Файл не загружен' });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    message: '✅ Файл успешно загружен',
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
  });
};