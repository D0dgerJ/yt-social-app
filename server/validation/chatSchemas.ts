import { z } from "zod";

export const sendMessageSchema = z
  .object({
    conversationId: z.number({ invalid_type_error: "conversationId must be a number" }),
    senderId: z.number({ invalid_type_error: "senderId must be a number" }),
    encryptedContent: z.string().optional(),
    mediaUrl: z.string().url().optional(),
    mediaType: z.enum(['image', 'video', 'file', 'gif', 'audio', 'text', 'sticker']).optional(),
    fileName: z.string().optional(),
    gifUrl: z.string().url().optional(),
    stickerUrl: z.string().url().optional(),
    repliedToId: z.number().optional(),
  })
  .refine(
    (data) =>
      !!data.encryptedContent ||
      !!data.mediaUrl ||
      !!data.gifUrl ||
      !!data.stickerUrl,
    {
      message: "Нельзя отправить пустое сообщение",
    }
  );


export const createChatSchema = z.object({
  userIds: z.array(z.number()).min(1, "At least one participant is required"),
  name: z.string().optional().nullable(),
  creatorId: z.number({ invalid_type_error: "creatorId must be a number" }),
});
