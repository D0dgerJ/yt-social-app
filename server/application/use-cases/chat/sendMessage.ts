import prisma from "../../../infrastructure/database/prismaClient";
import { sendMessageSchema } from "../../../validation/chatSchemas";
import { getIO } from "../../../infrastructure/websocket/socket";

interface SendMessageInput {
  conversationId: number;
  content: string;
  senderId: number;
}

export const sendMessage = async (data: SendMessageInput) => {
  // Валидация входных данных
  const { conversationId, content } = sendMessageSchema.parse(data);

  // Проверка: участвует ли пользователь в беседе
  const isParticipant = await prisma.participant.findFirst({
    where: {
      conversationId,
      userId: data.senderId,
    },
  });

  if (!isParticipant) {
    throw new Error("Вы не являетесь участником этого чата");
  }

  // Создание сообщения
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: data.senderId,
      content,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
  });

  // Отправка сообщения через сокет всем участникам комнаты
  getIO().to(String(conversationId)).emit("receiveMessage", message);

  return message;
};
