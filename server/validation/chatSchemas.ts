import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.number({ invalid_type_error: "conversationId must be a number" }),
  content: z.string().min(1, "Message cannot be empty"),
});

export const createChatSchema = z.object({
  participantIds: z.array(z.number()).min(1, "At least one participant is required"),
  name: z.string().optional().nullable(),
});
