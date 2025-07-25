import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Request, Response } from "express";
import { Readable } from "stream";

const s3 = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: `https://${process.env.SPACES_URL}`,
  credentials: {
    accessKeyId: process.env.S3_KEY!,
    secretAccessKey: process.env.S3_SECRET!,
  },
});

export const downloadMedia = async (req: Request, res: Response) => {
  const key = req.params.key;

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    });

    const response = await s3.send(command);

    if (!response.Body) {
      return res.status(404).json({ error: "Файл не найден" });
    }

    const fileName = key.split("/").pop() || "file";
    res.setHeader("Content-Type", response.ContentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const stream = response.Body as Readable;
    stream.pipe(res);
  } catch (err) {
    console.error("Ошибка при получении файла:", err);
    res.status(404).json({ error: "Файл не найден" });
  }
};
