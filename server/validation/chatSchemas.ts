import { z } from "zod";

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 50 MB

const isValidStorageUrl = (value: string): boolean => {
  if (!value || !value.trim()) return false;

  if (value.startsWith("/uploads/")) {
    return true;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const StorageUrlSchema = z
  .string()
  .trim()
  .min(1, "Storage url is required")
  .refine(isValidStorageUrl, {
    message: "Invalid storage url",
  });

const AttachmentSchema = z.object({
  url: StorageUrlSchema,
  mime: z.string().trim().min(1).max(255),
  name: z.string().trim().max(255).optional(),
  size: z.number().int().nonnegative().max(MAX_ATTACHMENT_SIZE).optional(),
  type: z.enum(["image", "video", "file", "gif", "audio"]).optional(),
});

export const createChatSchema = z.object({
  userIds: z
    .array(z.number().int().positive())
    .min(1, "At least one participant is required")
    .max(50, "Too many participants"),
  name: z.string().trim().min(1).max(120).optional().nullable(),
});

export const sendMessageSchema = z
  .object({
    content: z.string().trim().max(5000).optional().nullable(),

    mediaUrl: StorageUrlSchema.optional().nullable(),
    mediaType: z
      .enum(["image", "video", "file", "gif", "audio", "text", "sticker"])
      .optional()
      .nullable(),
    fileName: z.string().trim().max(255).optional().nullable(),

    gifUrl: StorageUrlSchema.optional().nullable(),
    stickerUrl: StorageUrlSchema.optional().nullable(),

    repliedToId: z.number().int().positive().optional().nullable(),

    clientMessageId: z.string().trim().max(128).optional().nullable(),

    attachments: z.array(AttachmentSchema).max(10).optional(),

    ttlSeconds: z
      .number()
      .int()
      .positive()
      .max(60 * 60 * 24 * 7)
      .optional()
      .nullable(),

    maxViewsPerUser: z
      .number()
      .int()
      .positive()
      .max(100)
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      !!data.content ||
      !!data.mediaUrl ||
      !!data.gifUrl ||
      !!data.stickerUrl ||
      !!(data.attachments && data.attachments.length > 0),
    { message: "Нельзя отправить пустое сообщение" }
  );

export const updateMessageSchema = z
  .object({
    content: z.string().trim().max(5000).optional().nullable(),
    mediaUrl: StorageUrlSchema.optional().nullable(),
    mediaType: z
      .enum(["image", "video", "file", "gif", "audio", "text", "sticker"])
      .optional()
      .nullable(),
    fileName: z.string().trim().max(255).optional().nullable(),
    gifUrl: StorageUrlSchema.optional().nullable(),
    stickerUrl: StorageUrlSchema.optional().nullable(),
    repliedToId: z.number().int().positive().optional().nullable(),
    clientMessageId: z.string().trim().max(128).optional().nullable(),
  })
  .refine(
    (data) =>
      data.content !== undefined ||
      data.mediaUrl !== undefined ||
      data.mediaType !== undefined ||
      data.fileName !== undefined ||
      data.gifUrl !== undefined ||
      data.stickerUrl !== undefined ||
      data.repliedToId !== undefined ||
      data.clientMessageId !== undefined,
    { message: "At least one field must be provided" }
  );