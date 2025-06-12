import prisma from "../../../infrastructure/database/prismaClient.ts";

interface AddReactionInput {
  userId: number;
  messageId: number;
  emoji: string;
}

export const addOrUpdateReaction = async ({ userId, messageId, emoji }: AddReactionInput) => {
  const existing = await prisma.reaction.findFirst({
    where: { userId, messageId },
  });

  if (existing) {
    if (existing.emoji === emoji) {
      // Если та же реакция — удалить (отмена реакции)
      await prisma.reaction.delete({ where: { id: existing.id } });
      return null;
    } else {
      // Иначе — обновить
      return await prisma.reaction.update({
        where: { id: existing.id },
        data: { emoji },
      });
    }
  }

  return await prisma.reaction.create({
    data: {
      userId,
      messageId,
      emoji,
    },
  });
};
