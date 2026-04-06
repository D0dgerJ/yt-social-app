import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createWriteStream } from "fs";
import fs from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { randomUUID } from "crypto";

import { env } from "../config/env.js";
import { s3, BUCKET, PUBLIC_BASE } from "../infrastructure/storage/s3Client.js";
import { LOCAL_UPLOADS_DIR } from "../infrastructure/storage/storagePaths.js";

export type UploadResult = {
  url: string;
  key: string;
  provider: "local" | "s3";
};

function normalizePublicBase(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getLocalFileNameFromUrl(input: string): string {
  try {
    const parsed = new URL(input);
    return path.basename(parsed.pathname);
  } catch {
    return path.basename(input);
  }
}

function getS3KeyFromUrl(input: string): string {
  if (!PUBLIC_BASE) {
    throw new Error("S3 public base URL is not configured");
  }

  const normalizedBase = normalizePublicBase(PUBLIC_BASE);

  try {
    const parsedInput = new URL(input);
    const inputNoQuery = parsedInput.toString().split("?")[0];

    if (inputNoQuery.startsWith(`${normalizedBase}/`)) {
      return decodeURIComponent(inputNoQuery.slice(normalizedBase.length + 1));
    }

    return decodeURIComponent(parsedInput.pathname.replace(/^\/+/, ""));
  } catch {
    const raw = input.split("?")[0];
    if (raw.startsWith(`${normalizedBase}/`)) {
      return decodeURIComponent(raw.slice(normalizedBase.length + 1));
    }
    return decodeURIComponent(raw.replace(/^\/+/, ""));
  }
}

async function writeUnknownBodyToFile(body: unknown, filePath: string) {
  if (body instanceof Readable) {
    await pipeline(body, createWriteStream(filePath));
    return;
  }

  const candidate = body as {
    transformToByteArray?: () => Promise<Uint8Array>;
  };

  if (candidate?.transformToByteArray) {
    const bytes = await candidate.transformToByteArray();
    await fs.writeFile(filePath, Buffer.from(bytes));
    return;
  }

  throw new Error("Unsupported storage body stream");
}

export async function uploadToStorage(
  file: Express.Multer.File
): Promise<UploadResult> {
  if (!file) {
    throw new Error("File is required");
  }

  if (env.STORAGE_PROVIDER === "local") {
    return {
      provider: "local",
      key: file.filename,
      url: `/uploads/${file.filename}`,
    };
  }

  if (!s3 || !BUCKET || !PUBLIC_BASE) {
    throw new Error("S3 storage is not configured");
  }

  const body = await fs.readFile(file.path);
  const fileExt = path.extname(file.originalname || file.filename).toLowerCase();
  const fileKey = `media/${randomUUID()}${fileExt}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
      Body: body,
      ContentType: file.mimetype || "application/octet-stream",
      ACL: "public-read",
    })
  );

  return {
    provider: "s3",
    key: fileKey,
    url: `${normalizePublicBase(PUBLIC_BASE)}/${fileKey}`,
  };
}

export async function downloadToTempForTranscription(
  fileUrlOrKey: string
): Promise<string> {
  if (!fileUrlOrKey) {
    throw new Error("fileUrlOrKey is required");
  }

  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "dodgerj-whisper-"));
  const ext =
    path.extname(fileUrlOrKey.split("?")[0]) ||
    ".bin";
  const tempPath = path.join(tempDir, `${randomUUID()}${ext}`);

  if (env.STORAGE_PROVIDER === "local") {
    const storedName = getLocalFileNameFromUrl(fileUrlOrKey);
    const sourcePath = path.resolve(LOCAL_UPLOADS_DIR, storedName);

    await fs.copyFile(sourcePath, tempPath);
    return tempPath;
  }

  if (!s3 || !BUCKET) {
    throw new Error("S3 storage is not configured");
  }

  const key = getS3KeyFromUrl(fileUrlOrKey);
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error("Storage object not found");
  }

  await writeUnknownBodyToFile(response.Body, tempPath);

  return tempPath;
}

export async function safeUnlink(filePath?: string | null) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch {}

  try {
    await fs.rm(path.dirname(filePath), { recursive: true, force: true });
  } catch {}
}