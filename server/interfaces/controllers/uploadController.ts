import { Request, Response } from "express";
import { fixLatin1ToUtf8 } from "../../utils/encoding.ts";

function getBaseUrl(req: Request) {
  const proto =
    (req.headers["x-forwarded-proto"] as string) ||
    req.protocol;
  const host =
    (req.headers["x-forwarded-host"] as string) ||
    req.get("host");
  return `${proto}://${host}`;
}

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
    res.status(400).json({ error: "Файлы не загружены" });
    return;
  }

  try {
    const base = getBaseUrl(req);

    const results = list.map((f) => {
      const fixedName = fixLatin1ToUtf8(f.originalname);
      const guessedType = detectMediaType(f.mimetype);

      return {
        url: `${base}/uploads/${f.filename}`, 
        originalName: fixedName,    
        mime: f.mimetype,
        size: f.size,
        type: guessedType,      
      };
    });

    res.json({ urls: results });
  } catch (e) {
    console.error("❌ Ошибка при загрузке файла(ов):", e);
    res.status(500).json({ error: "Ошибка при загрузке файла(ов)" });
  }
};

export const handleFileUpload = async (
  req: Request,
  res: Response
): Promise<void> => {
  const f = req.file;
  if (!f) {
    res.status(400).json({ error: "Файл не загружен" });
    return;
  }

  const base = getBaseUrl(req);
  const fixedName = fixLatin1ToUtf8(f.originalname);
  const guessedType = detectMediaType(f.mimetype);

  res.json({
    message: "✅ Файл успешно загружен",
    url: `${base}/uploads/${f.filename}`, 
    originalName: fixedName,   
    mime: f.mimetype,
    size: f.size,
    type: guessedType,
  });
};
