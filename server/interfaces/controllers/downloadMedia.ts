import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Request, Response } from "express";
import { Readable } from "stream";
import mime from "mime-types";

const s3 = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.SPACES_URL ? `https://${process.env.SPACES_URL}` : undefined,
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.S3_KEY!,
    secretAccessKey: process.env.S3_SECRET!,
  },
});

export const downloadMedia = async (req: Request, res: Response) => {
  const key = String(req.params.key || "").replace(/^\/+/, "");
  if (!key || key.includes("..")) {
    res.status(400).json({ error: "Некорректный ключ" });
    return;
  }

  try {
    const rangeHeader = req.headers.range as string | undefined;
    const cmd = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Range: rangeHeader,
    });

    const response = await s3.send(cmd);
    if (!response.Body) {
      res.status(404).json({ error: "Файл не найден" });
      return;
    }

    const fileName = key.split("/").pop() || "file";
    let contentType = response.ContentType || mime.lookup(fileName) || "application/octet-stream";
    contentType = String(contentType);

    const isPartial = !!rangeHeader && !!response.ContentRange;

    if (response.ETag) res.setHeader("ETag", response.ETag);
    if (response.LastModified) res.setHeader("Last-Modified", response.LastModified.toUTCString());
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", contentType);

    if (contentType.startsWith("audio/") || contentType.startsWith("video/")) {
      res.setHeader("Content-Disposition", "inline");
    } else {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
      );
    }

    if (response.ContentLength != null) {
      res.setHeader("Content-Length", String(response.ContentLength));
    }
    if (response.ContentRange) {
      res.setHeader("Content-Range", response.ContentRange);
    }
    if (isPartial) res.status(206);

    (response.Body as Readable).pipe(res);
  } catch (err) {
    console.error("Ошибка при получении файла:", err);
    res.status(404).json({ error: "Файл не найден" });
  }
};
