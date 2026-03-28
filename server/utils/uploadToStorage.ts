import { PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";
import { extname } from "path";
import { randomUUID } from "crypto";

import { env } from "../config/env.ts";
import cloudinary from "../infrastructure/config/cloudinary.ts";
import { s3, BUCKET, PUBLIC_BASE } from "../infrastructure/storage/s3Client.ts";

type UploadResult = {
  url: string;
  key?: string;
  provider: "local" | "cloudinary" | "s3";
};

function normalizePublicBase(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function detectResourceType(mime: string): "image" | "video" | "raw" | "auto" {
  const value = mime.toLowerCase();

  if (value.startsWith("image/")) return "image";
  if (value.startsWith("video/") || value.startsWith("audio/")) return "video";

  return "raw";
}

export const uploadToStorage = async (
  file: Express.Multer.File
): Promise<UploadResult> => {
  if (!file) {
    throw new Error("File is required");
  }

  switch (env.STORAGE_PROVIDER) {
    case "local": {
      return {
        provider: "local",
        key: file.filename,
        url: `/uploads/${file.filename}`,
      };
    }

    case "cloudinary": {
      const uploaded = await cloudinary.uploader.upload(file.path, {
        folder: "yt-social-app",
        resource_type: detectResourceType(file.mimetype),
        use_filename: false,
        unique_filename: true,
      });

      return {
        provider: "cloudinary",
        key: uploaded.public_id,
        url: uploaded.secure_url,
      };
    }

    case "s3": {
      if (!s3 || !BUCKET || !PUBLIC_BASE) {
        throw new Error("S3 storage is not configured");
      }

      const body = await readFile(file.path);
      const fileExt = extname(file.originalname || file.filename).toLowerCase();
      const fileKey = `media/${randomUUID()}${fileExt}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: fileKey,
          Body: body,
          ContentType: file.mimetype,
          ACL: "public-read",
        })
      );

      return {
        provider: "s3",
        key: fileKey,
        url: `${normalizePublicBase(PUBLIC_BASE)}/${fileKey}`,
      };
    }

    default: {
      const exhaustiveCheck: never = env.STORAGE_PROVIDER;
      throw new Error(`Unsupported storage provider: ${exhaustiveCheck}`);
    }
  }
};