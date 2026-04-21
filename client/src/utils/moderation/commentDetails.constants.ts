export const ALLOWED = new Set(["MODERATOR", "ADMIN", "OWNER"]);
export const ADMIN_PLUS = new Set(["ADMIN", "OWNER"]);

export const reasonLabel: Record<string, string> = {
  spam: "Spam",
  abuse: "Abuse",
  harassment: "Harassment",
  hate: "Hate",
  violence: "Violence",
  nudity: "Nudity",
  scam: "Scam",
  other: "Other",
};
