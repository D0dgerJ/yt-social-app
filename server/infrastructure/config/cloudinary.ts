import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const cloudName = process.env.CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.API_KEY ?? process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.API_SECRET ?? process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    "Cloudinary env is not set. Provide CLOUD_NAME/API_KEY/API_SECRET (or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET)."
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "yt-social-app",
    resource_type: "image",
  }),
});

export const parser = multer({ storage });
export default cloudinary;