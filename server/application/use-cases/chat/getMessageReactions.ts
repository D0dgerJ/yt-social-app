import prisma from "../../../infrastructure/database/prismaClient.ts";

interface GroupedReaction {
  emoji: string;
  count: number;
  users: {
    id: number;
    username: string;
    profilePicture: string | null;
  }[];
}

export const getMessageReactions = async (messageId: number): Promise<GroupedReaction[]> => {
  try {
    // ✅ Проверка: сообщение существует и не удалено
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { isDeleted: true },
    });

    if (!message || message.isDeleted) {
      throw new Error("Сообщение не найдено или было удалено");
    }

    // ✅ Загружаем реакции с данными пользователей
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

    // ✅ Группировка по emoji
    const groupedMap = new Map<string, GroupedReaction>();

    for (const reaction of reactions) {
      const { emoji, user } = reaction;
      const userInfo = {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
      };

      if (groupedMap.has(emoji)) {
        const group = groupedMap.get(emoji)!;
        group.count++;
        group.users.push(userInfo);
      } else {
        groupedMap.set(emoji, {
          emoji,
          count: 1,
          users: [userInfo],
        });
      }
    }

    return Array.from(groupedMap.values());
  } catch (error) {
    console.error("❌ Ошибка при получении реакций:", error);
    throw new Error("Не удалось получить реакции на сообщение");
  }
};
