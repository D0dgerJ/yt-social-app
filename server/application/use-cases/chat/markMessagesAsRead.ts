import prisma from "../../../infrastructure/database/prismaClient.ts";

interface MarkAsReadInput {
  conversationId: number;
  userId: number;
}

export const markMessagesAsRead = async ({ conversationId, userId }: MarkAsReadInput) => {
  try {
    // ✅ Проверяем, участник ли пользователь в беседе
    const isParticipant = await prisma.participant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!isParticipant) {
      throw new Error("Вы не являетесь участником этого чата");
    }

    // 📦 Обновляем непрочитанные, доставленные сообщения (не от себя)
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        isDelivered: true,
        isRead: false,
        isDeleted: false,
        senderId: {
          not: userId,
        },
      },
      data: {
        isRead: true,
      },
    });

    return { updated: result.count };
  } catch (error) {
    console.error("❌ Ошибка при отметке сообщений как прочитанных:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Не удалось обновить статус прочтения");
  }
};
