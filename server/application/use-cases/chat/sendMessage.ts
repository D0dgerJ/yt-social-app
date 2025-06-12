import prisma from "../../../infrastructure/database/prismaClient.ts";
import { sendMessageSchema } from "../../../validation/chatSchemas";
import { getIO } from "../../../infrastructure/websocket/socket";

interface SendMessageInput {
  conversationId: number;
  content?: string;
  senderId: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file' | 'gif' | 'audio' | 'text' | 'sticker';
  fileName?: string;
  gifUrl?: string;
  stickerUrl?: string;
  repliedToId?: number;
}

export const sendMessage = async (data: SendMessageInput) => {
  const {
    conversationId,
    senderId,
    content,
    mediaUrl,
    mediaType,
    fileName,
    gifUrl,
    stickerUrl,
    repliedToId,
  } = data;

  // Минимальная проверка: должно быть хотя бы одно поле
  if (!content && !mediaUrl && !gifUrl) {
    throw new Error("Нельзя отправить пустое сообщение");
  }

  // Проверка: участвует ли пользователь в беседе
  const isParticipant = await prisma.participant.findFirst({
    where: {
      conversationId,
      userId: senderId,
    },
  });

  if (!isParticipant) {
    throw new Error("Вы не являетесь участником этого чата");
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
      isDelivered: false,
      isRead: false,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      repliedTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          mediaUrl: true,
          mediaType: true,
        },
      },
    },
  });

  getIO().to(String(conversationId)).emit("receiveMessage", message);

  return message;
};
