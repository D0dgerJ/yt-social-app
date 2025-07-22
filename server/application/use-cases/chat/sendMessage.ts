import prisma from "../../../infrastructure/database/prismaClient.ts";
import { sendMessageSchema } from "../../../validation/chatSchemas.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";

interface SendMessageInput {
  conversationId: number;
  encryptedContent?: string;
  senderId: number;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'file' | 'gif' | 'audio' | 'text' | 'sticker';
  fileName?: string;
  gifUrl?: string;
  stickerUrl?: string;
  repliedToId?: number;
}

export const sendMessage = async (input: SendMessageInput) => {
  try {
    const data = sendMessageSchema.parse(input);

    const {
      conversationId,
      senderId,
      encryptedContent,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
    } = data;

    // ✅ Проверка: участник ли пользователь
    const isParticipant = await prisma.participant.findFirst({
      where: {
        conversationId,
        userId: senderId,
      },
    });

    if (!isParticipant) {
      throw new Error("Вы не являетесь участником этого чата");
    }

    // ✅ Опционально: проверка на repliedToId в пределах чата
    if (repliedToId) {
      const original = await prisma.message.findUnique({
        where: { id: repliedToId },
      });

      if (!original || original.conversationId !== conversationId) {
        throw new Error("Ответ на сообщение из другого чата запрещён");
      }
    }

    // 💬 Создание сообщения
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        encryptedContent,
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
            encryptedContent: true,
            senderId: true,
            mediaUrl: true,
            mediaType: true,
          },
        },
      },
    });

    // 🕒 Обновляем данные чата
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: message.id,
        updatedAt: new Date(),
      },
    });

    // 📡 Отправка по WebSocket
    getIO().to(String(conversationId)).emit("receiveMessage", message);

    return message;
  } catch (error) {
    console.error("❌ Ошибка при отправке сообщения:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Не удалось отправить сообщение");
  }
};
