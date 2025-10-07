import prisma from "../../../infrastructure/database/prismaClient.ts";

interface GroupedReaction {
  emoji: string;
  count: number;
  users: {
    id: number;
    username: string;
    profilePicture: string | null;
  }[];
  isMyReaction?: boolean;
}

interface GetMessageReactionsInput {
  messageId: number;
  userId?: number;
}

export const getMessageReactions = async ({
  messageId,
  userId,
}: GetMessageReactionsInput): Promise<GroupedReaction[]> => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, isDeleted: true },
    });

    if (!message || message.isDeleted) {
      throw new Error("Сообщение не найдено или было удалено");
    }

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

    if (reactions.length === 0) return [];

    const groupedMap = new Map<string, GroupedReaction>();

    for (const { emoji, user } of reactions) {
      const userInfo = {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
      };

      if (!groupedMap.has(emoji)) {
        groupedMap.set(emoji, {
          emoji,
          count: 1,
          users: [userInfo],
          isMyReaction: userId ? userId === user.id : undefined,
        });
      } else {
        const group = groupedMap.get(emoji)!;
        group.count++;
        group.users.push(userInfo);
        if (userId && user.id === userId) {
          group.isMyReaction = true;
        }
      }
    }
    const grouped = Array.from(groupedMap.values()).sort((a, b) => b.count - a.count);

    return grouped;
  } catch (error) {
    console.error("❌ Ошибка при получении реакций:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось получить реакции на сообщение");
  }
};
