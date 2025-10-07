import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";

interface DeleteMessageInput {
  messageId: number;
  userId: number;
}

export const deleteMessage = async ({ messageId, userId }: DeleteMessageInput) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Сообщение не найдено");
    }

    if (message.senderId !== userId) {
      throw new Error("Вы не можете удалить это сообщение");
    }

    const softDeleted = await prisma.message.update({
      where: { id: messageId },
      data: {
        encryptedContent: null,
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

    const conversation = await prisma.conversation.findUnique({
      where: { id: message.conversationId },
      select: { lastMessageId: true },
    });

    if (conversation?.lastMessageId === messageId) {
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

    getIO().to(String(message.conversationId)).emit("message:delete", {
      conversationId: message.conversationId,
      messageId: softDeleted.id,
    });

    return softDeleted;
  } catch (error) {
    console.error("❌ Ошибка при удалении сообщения:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Не удалось удалить сообщение");
  }
};
