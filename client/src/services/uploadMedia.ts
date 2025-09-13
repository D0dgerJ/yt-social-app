type UploadResult = {
  images: string[];
  videos: string[];
  files: string[];
};

const env = (import.meta as any).env ?? {};

const UPLOAD_URL =
  env.VITE_CLOUDINARY_UPLOAD_URL ||
  env.REACT_APP_CLOUDINARY_UPLOAD_URL || "";

const UPLOAD_PRESET =
  env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "";

function kindFromMime(mime: string): "image" | "video" | "file" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "file";
}

export async function uploadMedia(files: File[]): Promise<UploadResult> {
  if (!files?.length) return { images: [], videos: [], files: [] };

  if (!UPLOAD_URL) {
    console.warn("[uploadMedia] UPLOAD_URL не задан. Вернётся пустой результат.");
    return { images: [], videos: [], files: [] };
  }

  const out: UploadResult = { images: [], videos: [], files: [] };

  for (const file of files) {
    const form = new FormData();
    form.append("file", file);
    if (UPLOAD_PRESET) form.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upload failed: ${res.status} ${text}`);
    }

    const json = (await res.json()) as any;
    const url: string = json?.secure_url || json?.url;

    const k = kindFromMime(file.type);
    if (k === "image") out.images.push(url);
    else if (k === "video") out.videos.push(url);
    else out.files.push(url);
  }

  return out;
}