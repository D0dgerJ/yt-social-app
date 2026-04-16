import { z } from "zod";
import { mediaUrlSchema } from "./common.js";

export const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(30).optional(),
  bio: z.string().trim().max(160).optional(),
  website: z.string().trim().url().max(255).optional(),
});

export const updateProfilePictureSchema = z.object({
  profilePicture: mediaUrlSchema,
});