import { z } from "zod";
import { mediaUrlSchema } from "./common.js";

export const createStorySchema = z.object({
  mediaUrl: mediaUrlSchema,
  expiresAt: z.string().optional(),
});