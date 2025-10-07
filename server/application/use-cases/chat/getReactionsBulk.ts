import prisma from "../../../infrastructure/database/prismaClient.ts";

export interface GroupedReaction {
  emoji: string;
  count: number;
  users: {
    id: number;
    username: string;
    profilePicture: string | null;
  }[];
  isMyReaction?: boolean;
}

export async function getReactionsBulk(
  messageIds: number[],
  userId?: number
): Promise<Record<number, GroupedReaction[]>> {
  try {
    const ids = Array.from(new Set(messageIds.filter((n) => Number.isFinite(n) && n > 0))) as number[];
    if (ids.length === 0) return {};

    const reactions = await prisma.reaction.findMany({
      where: { messageId: { in: ids } },
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

    if (reactions.length === 0) {
      return Object.fromEntries(ids.map((id) => [id, []]));
    }

    const result: Record<number, Record<string, GroupedReaction>> = {};

    for (const reaction of reactions) {
      const { messageId, emoji, user } = reaction;

      if (!result[messageId]) result[messageId] = {};

      if (!result[messageId][emoji]) {
        result[messageId][emoji] = {
          emoji,
          count: 1,
          users: [user],
          isMyReaction: userId ? user.id === userId : undefined,
        };
      } else {
        const group = result[messageId][emoji];
        group.count++;
        group.users.push(user);
        if (userId && user.id === userId) {
          group.isMyReaction = true;
        }
      }
    }

    const final: Record<number, GroupedReaction[]> = {};
    for (const id of ids) {
      const reactionsForMessage = result[id]
        ? Object.values(result[id]).sort((a, b) => b.count - a.count)
        : [];
      final[id] = reactionsForMessage;
    }

    return final;
  } catch (error) {
    console.error("❌ Ошибка при массовом получении реакций:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось получить реакции");
  }
}
