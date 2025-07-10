import prisma from "../../../infrastructure/database/prismaClient.ts";

interface AddReactionInput {
  userId: number;
  messageId: number;
  emoji: string;
}

export const addOrUpdateReaction = async ({ userId, messageId, emoji }: AddReactionInput) => {
  try {
    // 🔍 Проверка: существует ли сообщение и не удалено
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, isDeleted: true, conversationId: true },
    });

    if (!message || message.isDeleted) {
      throw new Error("Сообщение не найдено или было удалено");
    }

    // ✅ Проверка: является ли пользователь участником беседы
    const isParticipant = await prisma.participant.findFirst({
      where: {
        conversationId: message.conversationId,
        userId,
      },
    });

    if (!isParticipant) {
      throw new Error("Вы не можете взаимодействовать с этим сообщением");
    }

    // 🔁 Проверка: есть ли уже реакция
    const existing = await prisma.reaction.findFirst({
      where: { userId, messageId },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        // 🧹 Удаление (повторное нажатие = отмена)
        await prisma.reaction.delete({ where: { id: existing.id } });

        // Можно добавить emit к WebSocket: reactionRemoved
        return null;
      } else {
        // 🔄 Обновление эмоджи
        const updated = await prisma.reaction.update({
          where: { id: existing.id },
          data: { emoji },
        });

        // Можно добавить emit: reactionUpdated
        return updated;
      }
    }

    // 🆕 Создание новой реакции
    const created = await prisma.reaction.create({
      data: {
        userId,
        messageId,
        emoji,
      },
    });

    // Можно добавить emit: reactionAdded
    return created;
  } catch (error) {
    console.error("❌ Ошибка при добавлении/обновлении реакции:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Не удалось обработать реакцию");
  }
};
