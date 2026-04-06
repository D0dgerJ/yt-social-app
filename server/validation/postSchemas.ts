import { z } from "zod";
import { mediaUrlSchema } from "./common.js";

export const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  mediaUrl: mediaUrlSchema.optional(),
});