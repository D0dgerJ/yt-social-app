import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";
import { extname } from "path";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: "your-region",
  endpoint: "https://your-spaces-url.digitaloceanspaces.com",
  credentials: {
    accessKeyId: process.env.S3_KEY!,
    secretAccessKey: process.env.S3_SECRET!,
  },
});

export const uploadToStorage = async (file: Express.Multer.File) => {
  const fileContent = readFileSync(file.path);
  const fileExt = extname(file.originalname);
  const fileKey = `media/${randomUUID()}${fileExt}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: fileKey,
    Body: fileContent,
    ContentType: file.mimetype,
    ACL: "public-read",
  }));

  return `https://${process.env.S3_BUCKET!}.your-spaces-url.digitaloceanspaces.com/${fileKey}`;
};
