const HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const IMAGE_CONTENT_TYPE_PREFIX = "image/";

type ResolveDroppedImagesResult = {
  files: File[];
  errors: string[];
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return HTTP_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function parseUriList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))
    .filter(isHttpUrl);
}

function parsePlainText(value: string): string[] {
  const trimmed = value.trim();
  return isHttpUrl(trimmed) ? [trimmed] : [];
}

function parseHtml(value: string): string[] {
  if (!value.trim()) return [];

  const doc = new DOMParser().parseFromString(value, "text/html");

  const imgUrls = Array.from(doc.querySelectorAll("img"))
    .map((img) => img.getAttribute("src")?.trim() || "")
    .filter(Boolean);

  const sourceUrls = Array.from(doc.querySelectorAll("source")).flatMap(
    (source) =>
      (source.getAttribute("srcset") || "")
        .split(",")
        .map((item) => item.trim().split(/\s+/)[0])
        .filter(Boolean)
  );

  return uniqueStrings([...imgUrls, ...sourceUrls].filter(isHttpUrl));
}

function getRemoteImageUrls(dataTransfer: DataTransfer): string[] {
  const uriList = parseUriList(dataTransfer.getData("text/uri-list"));
  const plainText = parsePlainText(dataTransfer.getData("text/plain"));
  const htmlUrls = parseHtml(dataTransfer.getData("text/html"));

  return uniqueStrings([...uriList, ...plainText, ...htmlUrls]);
}

function extensionFromContentType(contentType: string): string {
  switch (contentType.toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    case "image/bmp":
      return "bmp";
    case "image/svg+xml":
      return "svg";
    default:
      return "img";
  }
}

function buildFileName(url: string, contentType: string): string {
  try {
    const parsed = new URL(url);
    const rawName = parsed.pathname.split("/").filter(Boolean).pop();

    if (rawName && /\.[a-z0-9]{2,5}$/i.test(rawName)) {
      return decodeURIComponent(rawName);
    }
  } catch {
    // ignore
  }

  const ext = extensionFromContentType(contentType);
  return `dropped-image-${Date.now()}.${ext}`;
}

async function urlToImageFile(url: string): Promise<File> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
    });
  } catch {
    throw new Error("Источник запретил скачать изображение в браузере");
  }

  if (!response.ok) {
    throw new Error(`Не удалось скачать изображение (${response.status})`);
  }

  const headerContentType =
    response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ||
    "";

  if (!headerContentType.startsWith(IMAGE_CONTENT_TYPE_PREFIX)) {
    throw new Error("Источник вернул не изображение");
  }

  const blob = await response.blob();
  const blobType =
    blob.type?.split(";")[0].trim().toLowerCase() || headerContentType;

  if (!blobType.startsWith(IMAGE_CONTENT_TYPE_PREFIX)) {
    throw new Error("Полученные данные не являются изображением");
  }

  const fileName = buildFileName(url, blobType);

  return new File([blob], fileName, {
    type: blobType,
    lastModified: Date.now(),
  });
}

export function hasSupportedImageDropData(dataTransfer: DataTransfer): boolean {
  const hasImageFile = Array.from(dataTransfer.files).some((file) =>
    file.type.startsWith("image/")
  );

  const hasRemoteUrl = getRemoteImageUrls(dataTransfer).length > 0;
  const hasAnyFiles = dataTransfer.files.length > 0;

  return hasImageFile || hasRemoteUrl || hasAnyFiles;
}

export async function resolveDroppedImages(
  dataTransfer: DataTransfer
): Promise<ResolveDroppedImagesResult> {
  const files: File[] = [];
  const errors: string[] = [];

  const droppedFiles = Array.from(dataTransfer.files);
  const imageFiles = droppedFiles.filter((file) => file.type.startsWith("image/"));
  const nonImageFiles = droppedFiles.filter((file) => !file.type.startsWith("image/"));

  for (const file of nonImageFiles) {
    errors.push(`${file.name}: можно перетаскивать только изображения`);
  }

  if (imageFiles.length > 0) {
    return {
      files: imageFiles,
      errors,
    };
  }

  const remoteUrls = getRemoteImageUrls(dataTransfer);

  for (const url of remoteUrls) {
    try {
      const file = await urlToImageFile(url);
      files.push(file);
    } catch (error: any) {
      errors.push(`${url}: ${error?.message || "Не удалось загрузить изображение"}`);
    }
  }

  return {
    files,
    errors,
  };
}