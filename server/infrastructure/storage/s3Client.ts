import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../../config/env.js";

export const isS3Storage = env.STORAGE_PROVIDER === "s3";

export const s3 = isS3Storage
  ? new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY!,
        secretAccessKey: env.S3_SECRET_KEY!,
      },
    })
  : null;

export const BUCKET = env.S3_BUCKET ?? null;
export const PUBLIC_BASE = env.S3_PUBLIC_BASE_URL ?? null;