declare module "multer-storage-cloudinary" {
  import type { StorageEngine } from "multer";

  export class CloudinaryStorage implements StorageEngine {
    constructor(options: any);

    _handleFile(
      req: any,
      file: any,
      cb: (error?: any, info?: any) => void
    ): void;

    _removeFile(
      req: any,
      file: any,
      cb: (error: Error | null) => void
    ): void;
  }
}