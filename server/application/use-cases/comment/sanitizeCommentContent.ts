/*import sanitizeHtml from "sanitize-html";

export const sanitizeCommentContent = (content: string): string => {
  const cleaned = sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {},
  });
  // пример фильтрации оскорблений
  const blacklist = ["badword1", "badword2"];
  const regex = new RegExp(`\\b(${blacklist.join("|")})\\b`, "gi");
  return cleaned.replace(regex, "****");
};
*/