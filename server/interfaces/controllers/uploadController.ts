import fs from "fs/promises";
import { Request, Response } from "express";
import { fixLatin1ToUtf8 } from "../../utils/encoding.js";
import { uploadToStorage } from "../../utils/uploadToStorage.js";
import { env } from "../../config/env.js";

function detectMediaType(
  mime: string | undefined | null
): "image" | "video" | "audio" | "gif" | "file" {
  if (!mime) return "file";

  const m = mime.toLowerCase();

  if (m === "image/gif") return "gif";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";

  return "file";
}

async function cleanupTempUploads(files: Express.Multer.File[]) {
  if (env.STORAGE_PROVIDER !== "s3") {
    return;
  }

  await Promise.allSettled(
    files.map(async (file) => {
      if (!file?.path) return;
      try {
        await fs.unlink(file.path);
      } catch {}
    })
  );
}

export const handleUpload = async (
  req: Request,
  res: Response
): Promise<void> => {
  const multi = (req.files as Record<string, Express.Multer.File[]>) || {};
  const list: Express.Multer.File[] = [
    ...(Array.isArray(multi.files) ? multi.files : []),
    ...(Array.isArray(multi.file) ? multi.file : []),
    ...(req.file ? [req.file] : []),
  ];

  if (list.length === 0) {
    res.status(400).json({ error: "Files were not uploaded" });
    return;
  }

  try {
    const results = await Promise.all(
      list.map(async (f) => {
        const uploaded = await uploadToStorage(f);
        const fixedName = fixLatin1ToUtf8(f.originalname);
        const guessedType = detectMediaType(f.mimetype);

        return {
          url: uploaded.url,
          key: uploaded.key,
          provider: uploaded.provider,
          originalName: fixedName,
          mime: f.mimetype,
          size: f.size,
          type: guessedType,
        };
      })
    );

    res.json({ urls: results });
  } catch (e) {
    console.error("❌ Error while uploading file(s):", e);
    res.status(500).json({ error: "Error while uploading file(s)" });
  } finally {
    await cleanupTempUploads(list);
  }
};

export const handleFileUpload = async (
  req: Request,
  res: Response
): Promise<void> => {
  const f = req.file;

  if (!f) {
    res.status(400).json({ error: "File was not uploaded" });
    return;
  }

  try {
    const uploaded = await uploadToStorage(f);
    const fixedName = fixLatin1ToUtf8(f.originalname);
    const guessedType = detectMediaType(f.mimetype);

    res.json({
      message: "✅ File uploaded successfully",
      url: uploaded.url,
      key: uploaded.key,
      provider: uploaded.provider,
      originalName: fixedName,
      mime: f.mimetype,
      size: f.size,
      type: guessedType,
    });
  } catch (e) {
    console.error("❌ Error while uploading file:", e);
    res.status(500).json({ error: "Error while uploading file" });
  } finally {
    if (env.STORAGE_PROVIDER === "s3" && f?.path) {
      try {
        await fs.unlink(f.path);
      } catch {}
    }
  }
};