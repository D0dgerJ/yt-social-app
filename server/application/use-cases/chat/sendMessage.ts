import prisma from "../../../infrastructure/database/prismaClient.ts";
import { sendMessageSchema } from "../../../validation/chatSchemas.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";
import { redisPub } from "../../../infrastructure/redis/redisClient.ts";

interface SendMessageInput {
  conversationId: number;
  encryptedContent?: string;
  senderId: number; // должен передаваться из авторизованного контекста (req.user.id)
  mediaUrl?: string;
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

    // ✅ Проверка участника
    const isParticipant = await prisma.participant.findFirst({
      where: {
        conversationId,
        userId: senderId,
      },
    });

    if (!isParticipant) {
      throw new Error("Вы не являетесь участником этого чата");
    }

    // 🔐 TODO: здесь можно вставить фильтрацию медиа и шифрование, если требуется

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

    // 🕒 Обновляем lastMessageId и время
    await prisma.conversation.updateMany({
      where: { id: conversationId },
      data: {
        lastMessageId: message.id,
        updatedAt: new Date(),
      },
    });

    // 📡 WebSocket — отправка в комнату
    getIO().to(String(conversationId)).emit("receiveMessage", message);

    // 📣 Redis Pub/Sub — отправка события
    await redisPub.publish("newMessage", JSON.stringify(message));

    return message;
  } catch (error) {
    console.error("Ошибка при отправке сообщения:", error);
    throw new Error("Не удалось отправить сообщение");
  }
};
