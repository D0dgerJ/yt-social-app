import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";

interface DeleteMessageInput {
  messageId: number;
  userId: number;
}

export const deleteMessage = async ({ messageId, userId }: DeleteMessageInput) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) throw new Error("Сообщение не найдено");

  if (message.senderId !== userId) {
    throw new Error("Вы не можете удалить это сообщение");
  }

  const softDeleted = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: null,
      mediaUrl: null,
      mediaType: null,
      fileName: null,
      gifUrl: null,
      stickerUrl: null,
      audioText: null,
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  // 🧠 Проверка: это последнее сообщение в беседе?
  const conversation = await prisma.conversation.findUnique({
    where: { id: message.conversationId },
    select: { lastMessageId: true },
  });

  if (conversation?.lastMessageId === messageId) {
    // Находим предыдущее не удалённое сообщение
    const previous = await prisma.message.findFirst({
      where: {
        conversationId: message.conversationId,
        isDeleted: false,
        id: { lt: messageId },
      },
      orderBy: { id: "desc" },
    });

    await prisma.conversation.update({
      where: { id: message.conversationId },
      data: {
        lastMessageId: previous?.id ?? null,
        updatedAt: new Date(),
      },
    });
  }

  getIO().to(String(message.conversationId)).emit("messageDeleted", {
    messageId: softDeleted.id,
    conversationId: message.conversationId,
  });

  return softDeleted;
};
