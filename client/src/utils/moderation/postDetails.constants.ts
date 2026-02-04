export const ALLOWED = new Set(["MODERATOR", "ADMIN", "OWNER"]);
export const ADMIN_PLUS = new Set(["ADMIN", "OWNER"]);

export const reasonLabel: Record<string, string> = {
  spam: "Спам",
  abuse: "Оскорбления",
  harassment: "Травля",
  hate: "Ненависть",
  violence: "Насилие",
  nudity: "Нагота",
  scam: "Мошенничество",
  other: "Другое",
};