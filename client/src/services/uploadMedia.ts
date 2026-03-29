import { env } from "../config/env";

type UploadMediaResponse = {
  success: boolean;
  url: string;
  key?: string;
  provider: "local" | "cloudinary" | "s3";
  name: string;
  mime: string;
  size: number;
};

export async function uploadMedia(file: File, token?: string): Promise<UploadMediaResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${env.API_URL}/api/upload/media`, {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Ошибка загрузки файла");
  }

  return data as UploadMediaResponse;
}