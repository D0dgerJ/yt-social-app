import axios from "@/utils/api/axiosInstance";

type UploadedItem = {
  url: string;
  originalName?: string;
  mime: string;
  size: number;
  type: "image" | "video" | "audio" | "gif" | "file";
};

type UploadMediaResponse = {
  urls: UploadedItem[];
};

export async function uploadMedia(files: File[]): Promise<UploadMediaResponse> {
  if (!files?.length) {
    return { urls: [] };
  }

  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  const { data } = await axios.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data as UploadMediaResponse;
}