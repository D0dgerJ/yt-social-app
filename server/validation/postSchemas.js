import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  mediaUrl: z.string().url("Invalid media URL").optional(),
});