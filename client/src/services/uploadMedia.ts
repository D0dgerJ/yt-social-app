import axios from "@/utils/api/axiosInstance";

export type UploadedItem = {
  url: string;
  key?: string;
  provider: "local" | "s3";
  originalName: string;
  mime: string;
  size: number;
  type: "image" | "video" | "audio" | "gif" | "file";
};

export type UploadPostMediaResult = {
  uploaded: UploadedItem[];
  images: string[];
  videos: string[];
  files: string[];
};

function normalizeUploadResponse(data: any): UploadedItem[] {
  const raw = Array.isArray(data?.urls)
    ? data.urls
    : Array.isArray(data?.files)
    ? data.files
    : data?.url
    ? [data]
    : [];

  return raw
    .map((item: any): UploadedItem | null => {
      const url = item?.url ?? item?.fileUrl ?? item?.path ?? item?.location;
      if (!url) return null;

      const type = item?.type;
      const normalizedType: UploadedItem["type"] =
        type === "image" ||
        type === "video" ||
        type === "audio" ||
        type === "gif" ||
        type === "file"
          ? type
          : "file";

      const provider =
        item?.provider === "s3" || item?.provider === "local"
          ? item.provider
          : "local";

      return {
        url,
        key: item?.key,
        provider,
        originalName:
          item?.originalName ??
          item?.name ??
          item?.fileName ??
          item?.originalname ??
          "",
        mime: item?.mime ?? item?.mimetype ?? "application/octet-stream",
        size: Number(item?.size ?? 0),
        type: normalizedType,
      };
    })
    .filter(Boolean) as UploadedItem[];
}

export async function uploadMedia(files: File[]): Promise<UploadPostMediaResult> {
  if (!files?.length) {
    return {
      uploaded: [],
      images: [],
      videos: [],
      files: [],
    };
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await axios.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const uploaded = normalizeUploadResponse(response.data);

  if (!uploaded.length) {
    throw new Error("Empty server response while uploading files");
  }

  const images: string[] = [];
  const videos: string[] = [];
  const commonFiles: string[] = [];

  for (const item of uploaded) {
    if (item.type === "image" || item.type === "gif") {
      images.push(item.url);
      continue;
    }

    if (item.type === "video") {
      videos.push(item.url);
      continue;
    }

    commonFiles.push(item.url);
  }

  return {
    uploaded,
    images,
    videos,
    files: commonFiles,
  };
}