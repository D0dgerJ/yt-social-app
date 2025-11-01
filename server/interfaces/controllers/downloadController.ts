import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import { fileURLToPath } from "url";
import prisma from "../../infrastructure/database/prismaClient.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, "../../uploads");

const withinBase = (absPath: string) => {
  const rel = path.relative(BASE_DIR, absPath);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
};

function buildContentDisposition(originalNameFromDb: string | null | undefined, storedFileName: string) {
  const finalName = (originalNameFromDb && originalNameFromDb.trim())
    ? originalNameFromDb.trim()
    : storedFileName;

  const fallbackName = finalName.replace(/[^\x20-\x7E]+/g, "_");

  const encodedName = encodeURIComponent(finalName).replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");

  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
}

const downloadFile = async (req: Request, res: Response): Promise<void> => {
  const raw = String(req.params.filename || "");
  const storedFileName = path.basename(raw).trim();
  const abs = path.resolve(BASE_DIR, storedFileName);

  if (
    !withinBase(abs) ||
    !fs.existsSync(abs) ||
    !fs.statSync(abs).isFile()
  ) {
    res.status(404).json({ error: "Файл не найден" });
    return;
  }

  const stat = fs.statSync(abs);
  const mimeType = mime.lookup(abs) || "application/octet-stream";

  let originalNameFromDb: string | null = null;

  try {
    const media = await prisma.mediaFile.findFirst({
      where: {
        OR: [
          { url: { endsWith: `/uploads/${storedFileName}` } },
          { url: { endsWith: `/${storedFileName}` } },
          { url: { endsWith: storedFileName } },
        ],
      },
      select: {
        originalName: true,
      },
    });

    if (media?.originalName) {
      originalNameFromDb = media.originalName;
    }
  } catch (err) {
    console.error("[downloadFile] DB lookup failed:", err);
  }

  res.setHeader("Cache-Control", "private, max-age=86400");
  res.setHeader("Content-Type", String(mimeType));
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader(
    "Content-Disposition",
    buildContentDisposition(originalNameFromDb, storedFileName)
  );

  const range = req.headers.range;
  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = Number.parseInt(startStr, 10);
    const end = endStr ? Number.parseInt(endStr, 10) : stat.size - 1;

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start > end ||
      end >= stat.size
    ) {
      res.status(416).setHeader("Content-Range", `bytes */${stat.size}`).end();
      return;
    }

    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
    res.setHeader("Content-Length", String(end - start + 1));
    fs.createReadStream(abs, { start, end }).pipe(res);
    return;
  }

  res.setHeader("Content-Length", String(stat.size));
  fs.createReadStream(abs).pipe(res);
};

export default downloadFile;
