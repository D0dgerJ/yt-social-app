import { z } from "zod";

export const createStorySchema = z.object({
  mediaUrl: z.string().url("Invalid media URL"),
  expiresAt: z.string().optional(), // ISO timestamp (если нужно указать время)
});