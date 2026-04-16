import { z } from "zod";
import { mediaUrlSchema } from "./common.js";

const mediaArraySchema = z.array(mediaUrlSchema).max(20).optional();

export const createPostSchema = z
  .object({
    desc: z.string().trim().max(2000, "Post text is too long").optional(),

    images: mediaArraySchema,
    videos: mediaArraySchema,
    files: mediaArraySchema,

    tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),

    location: z.string().trim().max(120).optional(),
  })
  .refine(
    (data) => {
      const hasText = !!data.desc?.trim();
      const hasImages = !!data.images?.length;
      const hasVideos = !!data.videos?.length;
      const hasFiles = !!data.files?.length;

      return hasText || hasImages || hasVideos || hasFiles;
    },
    {
      message: "Post must contain text or at least one attachment",
    }
  );

export const updatePostSchema = z
  .object({
    desc: z.string().trim().max(2000, "Post text is too long").optional(),

    images: mediaArraySchema,
    videos: mediaArraySchema,
    files: mediaArraySchema,

    tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),

    location: z.string().trim().max(120).optional(),
  })
  .refine(
    (data) =>
      data.desc !== undefined ||
      data.images !== undefined ||
      data.videos !== undefined ||
      data.files !== undefined ||
      data.tags !== undefined ||
      data.location !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

export const reportPostSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(2, "Reason is required")
    .max(200, "Reason is too long"),
  message: z
    .string()
    .trim()
    .max(500, "Message is too long")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});