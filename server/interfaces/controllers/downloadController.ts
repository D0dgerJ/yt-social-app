import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const downloadFile = (req: Request, res: Response): void => {
  const { filename } = req.params;
  const filePath = path.resolve(__dirname, '../../../uploads', filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Файл не найден' });
    return;
  }

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.download(filePath);
};

export default downloadFile;