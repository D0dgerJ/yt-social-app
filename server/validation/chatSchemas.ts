import { z } from "zod";

const AttachmentSchema = z.object({
  url: z.string().url(),
  mime: z.string().min(1),
  name: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
  type: z.enum(["image", "video", "file", "gif", "audio"]).optional(),
});

export const sendMessageSchema = z
  .object({
    conversationId: z.number({ invalid_type_error: "conversationId must be a number" }).int().positive(),
    senderId: z.number({ invalid_type_error: "senderId must be a number" }).int().positive(),

    encryptedContent: z.string().optional().nullable(),

    attachments: z.array(AttachmentSchema).max(10).optional(),

    mediaUrl: z.string().url().optional().nullable(),
    mediaType: z
      .enum(["image", "video", "file", "gif", "audio", "text", "sticker"])
      .optional()
      .nullable(),
    fileName: z.string().optional(),

    gifUrl: z.string().url().optional().nullable(),
    stickerUrl: z.string().url().optional().nullable(),

    repliedToId: z.number().int().positive().optional().nullable(),

    clientMessageId: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      !!data.encryptedContent ||
      !!(data.attachments && data.attachments.length > 0) ||
      !!data.gifUrl ||
      !!data.stickerUrl ||
      !!data.mediaUrl, 
    { message: "Нельзя отправить пустое сообщение" }
  );


export const createChatSchema = z.object({
  userIds: z.array(z.number()).min(1, "At least one participant is required"),
  name: z.string().optional().nullable(),
  creatorId: z.number({ invalid_type_error: "creatorId must be a number" }).int().positive(),
});

export const updateMessageSchema = z
  .object({
    messageId: z.number().int().positive().optional(),

    clientMessageId: z.string().optional().nullable(),
    conversationId: z.number().int().positive().optional(),

    userId: z.number().int().positive(),

    encryptedContent: z.string().optional().nullable(),
    mediaUrl: z.string().url().optional().nullable(),
    mediaType: z
      .enum(["image", "video", "file", "gif", "audio", "text", "sticker"])
      .optional()
      .nullable(),
    fileName: z.string().optional().nullable(),
    gifUrl: z.string().url().optional().nullable(),
    stickerUrl: z.string().url().optional().nullable(),
    repliedToId: z.number().int().positive().optional().nullable(),
  })
  .refine(
    (data) =>
      !!data.messageId ||
      (!!data.clientMessageId && !!data.conversationId),
    { message: "Нужно указать messageId или пару clientMessageId + conversationId" }
  );
