import {
  IMAGE_MIME,
  VIDEO_MIME,
  FILE_MIME,
  MAX_IMAGE_MB,
  MAX_VIDEO_MB,
  MAX_FILE_MB,
  MAX_TOTAL_FILES,
  bytesToMB,
} from "../constants/mime";

export type MediaKind = "image" | "video" | "file";

export function detectKind(file: File): MediaKind {
  if (IMAGE_MIME.includes(file.type)) return "image";
  if (VIDEO_MIME.includes(file.type)) return "video";
  return "file";
}

export function limitFor(kind: MediaKind) {
  switch (kind) {
    case "image": return MAX_IMAGE_MB;
    case "video": return MAX_VIDEO_MB;
    default:      return MAX_FILE_MB;
  }
}

export function assertAllowed(file: File): { ok: boolean; reason?: string; kind: MediaKind } {
  const kind = detectKind(file);
  const sizeMB = bytesToMB(file.size);
  const max = limitFor(kind);

  const allowed =
    (kind === "image" && IMAGE_MIME.includes(file.type)) ||
    (kind === "video" && VIDEO_MIME.includes(file.type)) ||
    (kind === "file"  && FILE_MIME.includes(file.type));

  if (!allowed) {
    return { ok: false, kind, reason: `Unsupported type: ${file.type || "unknown"}` };
  }
  if (sizeMB > max) {
    return { ok: false, kind, reason: `File size ${sizeMB.toFixed(1)}MB exceeds the ${max}MB limit` };
  }
  return { ok: true, kind };
}

export function assertTotalCount(currentCount: number, incoming: number) {
  if (currentCount + incoming > MAX_TOTAL_FILES) {
    return {
      ok: false,
      reason: `The total file limit (${MAX_TOTAL_FILES}) has been exceeded.`,
    };
  }
  return { ok: true };
}
