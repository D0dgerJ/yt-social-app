import { z } from "zod";

export const mediaUrlSchema = z.string().refine(
  (val) =>
    val.startsWith("http://") ||
    val.startsWith("https://") ||
    val.startsWith("/uploads/"),
  {
    message: "Invalid media URL",
  }
);