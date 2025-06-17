import prisma from '../../../infrastructure/database/prismaClient.ts';

interface LeaveConversationInput {
  conversationId: number;
  userId: number;        // Кого удаляем
  requestedById: number; // Кто делает действие
}

export const leaveConversation = async ({ conversationId, userId, requestedById }: LeaveConversationInput) => {
  // Проверка: удаляемый участник существует
  const participant = await prisma.participant.findFirst({
    where: {
      conversationId,
      userId,
    },
  });

  if (!participant) {
    throw new Error("Пользователь не является участником этого чата");
  }

  // Если кто-то другой инициирует удаление — проверим его права
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
  }

  // Удаляем участника
  await prisma.participant.delete({
    where: { id: participant.id },
  });

  // Проверяем, остались ли участники
  const remaining = await prisma.participant.count({
    where: { conversationId },
  });

  // Если никого не осталось — удаляем чат и все сообщения
  if (remaining === 0) {
    await prisma.message.deleteMany({ where: { conversationId } });
    await prisma.conversation.delete({ where: { id: conversationId } });

    return { conversationDeleted: true };
  }

  return { conversationDeleted: false };
};
