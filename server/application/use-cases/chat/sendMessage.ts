import prisma from "../../../infrastructure/database/prismaClient.ts";
import { sendMessageSchema } from "../../../validation/chatSchemas.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";

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

export const sendMessage = async (input: SendMessageInput) => {
  const data = sendMessageSchema.parse(input);

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

  // 📌 Обновляем lastMessageId и updatedAt у чата
  await prisma.conversation.updateMany({
    where: { id: conversationId },
    data: {
      lastMessageId: message.id,
      updatedAt: new Date(),
    } as any,
  });


  // 📡 Отправляем по сокетам
  getIO().to(String(conversationId)).emit("receiveMessage", message);

  return message;
};
