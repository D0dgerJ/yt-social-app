import { z } from "zod";

export const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  bio: z.string().max(160).optional(),
  website: z.string().url().optional(),
});

export const updateProfilePictureSchema = z.object({
  avatarUrl: z.string().url("Invalid URL"),
});