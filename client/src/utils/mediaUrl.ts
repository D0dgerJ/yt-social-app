import { env } from "@/config/env";

export function toAbsoluteMediaUrl(url?: string | null): string {
  if (!url) return "";

  try {
    return new URL(url).toString();
  } catch {
    const base = env.SERVER_ORIGIN.replace(/\/+$/, "");
    const rel = String(url).replace(/^\/+/, "");
    return `${base}/${rel}`;
  }
}