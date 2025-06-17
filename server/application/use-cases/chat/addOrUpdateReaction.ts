import prisma from "../../../infrastructure/database/prismaClient.ts";

interface AddReactionInput {
  userId: number;
  messageId: number;
  emoji: string;
}

export const addOrUpdateReaction = async ({ userId, messageId, emoji }: AddReactionInput) => {
  // 1. Проверка: сообщение существует и не удалено
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { isDeleted: true },
  });

  if (!message || message.isDeleted) {
    throw new Error("Сообщение не найдено или было удалено");
  }

  // 2. Проверка: уже есть реакция от этого пользователя
  const existing = await prisma.reaction.findFirst({
    where: { userId, messageId },
  });

  if (existing) {
    if (existing.emoji === emoji) {
      // 🧹 Отмена реакции (удаление)
      await prisma.reaction.delete({ where: { id: existing.id } });
      return null;
    } else {
      // 🔁 Обновление эмоджи
      return await prisma.reaction.update({
        where: { id: existing.id },
        data: { emoji },
      });
    }
  }

  // 3. Создание новой реакции
  return await prisma.reaction.create({
    data: {
      userId,
      messageId,
      emoji,
    },
  });
};
