import prisma from '../../../infrastructure/database/prismaClient.ts';

interface LeaveConversationInput {
  conversationId: number;
  userId: number;        // Кого удаляем
  requestedById: number; // Кто делает действие
}

export const leaveConversation = async ({ conversationId, userId, requestedById }: LeaveConversationInput) => {
  try {
    // ✅ Проверка: существует ли участник
    const participant = await prisma.participant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      throw new Error("Пользователь не является участником этого чата");
    }

    // ✅ Проверка прав инициатора, если он удаляет не себя
    if (requestedById !== userId) {
      const requester = await prisma.participant.findFirst({
        where: {
          conversationId,
          userId: requestedById,
        },
      });

      if (!requester || !["admin", "owner"].includes(requester.role)) {
        throw new Error("Недостаточно прав для удаления участника");
      }

      // Нельзя удалять владельца
      if (participant.role === "owner") {
        throw new Error("Нельзя удалить владельца чата");
      }
    }

    // 🧹 Удаляем участника
    await prisma.participant.delete({
      where: { id: participant.id },
    });

    // 🧪 Проверяем, остались ли участники
    const remaining = await prisma.participant.count({
      where: { conversationId },
    });

    if (remaining === 0) {
      // 💥 Удаляем все связанные данные (сообщения + чат)
      await prisma.message.deleteMany({ where: { conversationId } });
      await prisma.conversation.delete({ where: { id: conversationId } });

      return { conversationDeleted: true };
    }

    return { conversationDeleted: false };
  } catch (error) {
    console.error("❌ Ошибка при выходе из чата:", error);
    throw new Error("Не удалось выйти из чата");
  }
};
