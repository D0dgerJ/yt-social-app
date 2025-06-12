import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";

interface DeleteMessageInput {
  messageId: number;
  userId: number; // <- кто пытается удалить
}

export const deleteMessage = async ({ messageId, userId }: DeleteMessageInput) => {
  // Проверка: существует ли сообщение
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error("Сообщение не найдено");
  }

  // Проверка: только отправитель может удалить
  if (message.senderId !== userId) {
    throw new Error("Вы не можете удалить это сообщение");
  }

  const deleted = await prisma.message.delete({
    where: { id: messageId },
  });

  // 📡 Socket уведомление (если нужно)
  getIO().to(String(message.conversationId)).emit("messageDeleted", {
    messageId: deleted.id,
    conversationId: message.conversationId,
  });

  return deleted;
};
