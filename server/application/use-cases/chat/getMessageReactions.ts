import prisma from "../../../infrastructure/database/prismaClient.ts";

export const getMessageReactions = async (messageId: number) => {
  // Проверка на удалённое сообщение
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { isDeleted: true },
  });

  if (!message || message.isDeleted) {
    throw new Error("Сообщение не найдено или было удалено");
  }

  // Загружаем все реакции с пользователями
  const reactions = await prisma.reaction.findMany({
    where: { messageId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
  });

  // Группировка по emoji
  const grouped = reactions.reduce((acc, reaction) => {
    const existing = acc.find((r) => r.emoji === reaction.emoji);

    const user = {
      id: reaction.user.id,
      username: reaction.user.username,
      profilePicture: reaction.user.profilePicture,
    };

    if (existing) {
      existing.count++;
      existing.users.push(user);
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        users: [user],
      });
    }

    return acc;
  }, [] as {
    emoji: string;
    count: number;
    users: {
      id: number;
      username: string;
      profilePicture: string | null;
    }[];
  }[]);

  return grouped;
};
