import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Request, Response } from "express";
import { Readable } from "stream";
import mime from "mime-types";

import { env } from "../../config/env.ts";
import { s3, BUCKET } from "../../infrastructure/storage/s3Client.ts";

export const downloadMedia = async (req: Request, res: Response) => {
  if (env.STORAGE_PROVIDER !== "s3") {
    res.status(404).json({ error: "S3 media route is disabled for current STORAGE_PROVIDER" });
    return;
  }

  if (!s3 || !BUCKET) {
    res.status(500).json({ error: "S3 storage is not configured" });
    return;
  }

  const key = String(req.params.key || "").replace(/^\/+/, "");

  if (!key || key.includes("..")) {
    res.status(400).json({ error: "Некорректный ключ" });
    return;
  }

  try {
    const rangeHeader = req.headers.range as string | undefined;

    const cmd = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Range: rangeHeader,
    });

    const response = await s3.send(cmd);

    if (!response.Body) {
      res.status(404).json({ error: "Файл не найден" });
      return;
    }

    const fileName = key.split("/").pop() || "file";
    let contentType =
      response.ContentType || mime.lookup(fileName) || "application/octet-stream";

    contentType = String(contentType);

    const isPartial = Boolean(rangeHeader && response.ContentRange);

    if (response.ETag) {
      res.setHeader("ETag", response.ETag);
    }

    if (response.LastModified) {
      res.setHeader("Last-Modified", response.LastModified.toUTCString());
    }

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

    if (isPartial) {
      res.status(206);
    }

    (response.Body as Readable).pipe(res);
  } catch (err) {
    console.error("Ошибка при получении файла:", err);
    res.status(404).json({ error: "Файл не найден" });
  }
};