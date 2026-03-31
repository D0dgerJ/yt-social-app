import { z } from "zod";
import { mediaUrlSchema } from "./common.ts";

export const createStorySchema = z.object({
  mediaUrl: mediaUrlSchema,
  expiresAt: z.string().optional(),
});