export function createObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeObjectUrl(url?: string | null) {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    // no-op
  }
}

export function revokeMany(urls: Array<string | null | undefined>) {
  urls.forEach((u) => revokeObjectUrl(u || undefined));
}
