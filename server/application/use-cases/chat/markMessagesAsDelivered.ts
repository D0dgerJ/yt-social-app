import prisma from "../../../infrastructure/database/prismaClient.ts";

interface MarkDeliveredInput {
  conversationId: number;
  userId: number;
}

export const markMessagesAsDelivered = async ({ conversationId, userId }: MarkDeliveredInput) => {
  try {
    // ✅ Проверка: является ли пользователь участником беседы
    const isParticipant = await prisma.participant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!isParticipant) {
      throw new Error("Вы не являетесь участником этого чата");
    }

    // 📦 Обновляем сообщения (от других участников) как доставленные
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        isDelivered: false,
        isDeleted: false,
      },
      data: {
        isDelivered: true,
      },
    });

    return { updated: result.count };
  } catch (error) {
    console.error("❌ Ошибка при обновлении статуса delivered:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Не удалось обновить статус delivered");
  }
};
