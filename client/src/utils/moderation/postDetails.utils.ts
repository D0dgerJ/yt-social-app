export function fmt(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export function clip(text?: string | null, max = 220) {
  const t = (text ?? "").trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function extractApiError(e: any): { message: string; details?: any } {
  const msg =
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    "Request failed";

  const details = e?.response?.data?.details;
  return { message: String(msg), details };
}
