import prisma from "../../../infrastructure/database/prismaClient.ts";

interface GetConversationMessagesInput {
  conversationId: number;
  userId: number;

  cursorId?: number | null;

  limit?: number;

  direction?: "backward" | "forward";

  markDelivered?: boolean;
}

export const getConversationMessages = async ({
  conversationId,
  userId,
  cursorId = null,
  limit = 20,
  direction = "backward",
  markDelivered = true,
}: GetConversationMessagesInput) => {
  try {
    const isParticipant = await prisma.participant.findFirst({
      where: { conversationId, userId },
      select: { id: true },
    });
    if (!isParticipant) {
      throw new Error("Вы не имеете доступа к этому чату");
    }

    const whereCursor =
      cursorId && cursorId > 0
        ? direction === "backward"
          ? { id: { lt: cursorId } }
          : { id: { gt: cursorId } }
        : {};

    const baseWhere = {
      conversationId,
      isDeleted: false,
      ...whereCursor,
    };

    const messages = await prisma.message.findMany({
      where: baseWhere,
      orderBy: { id: direction === "backward" ? "desc" : "asc" },
      take: limit,
      include: {
        sender: {
          select: { id: true, username: true, profilePicture: true },
        },
        repliedTo: {
          select: {
            id: true,
            encryptedContent: true,
            mediaUrl: true,
            mediaType: true,
            fileName: true,
            senderId: true,
            isDeleted: true,
            sender: {
              select: { id: true, username: true, profilePicture: true },
            },
          },
        },
        mediaFiles: {
          select: {
            id: true,
            url: true,
            type: true,
            uploadedAt: true,

            originalName: true,
            mime: true,
            size: true,
          },
        },
      },
    });

    if (messages.length === 0) {
      return {
        messages: [],
        pageInfo: {
          hasMore: false,
          nextCursor: null as number | null,
          direction,
        },
      };
    }

    const messageIds = messages.map((m) => m.id);

    const pinnedMessages = await prisma.pinnedMessage.findMany({
      where: {
        conversationId,
        messageId: { in: messageIds },
      },
      select: {
        messageId: true,
        pinnedAt: true,
      },
    });

    const pinnedMap = new Map<number, Date>();
    pinnedMessages.forEach((p) => {
      pinnedMap.set(p.messageId, p.pinnedAt);
    });

    const allReactions = await prisma.reaction.findMany({
      where: { messageId: { in: messageIds } },
      select: {
        messageId: true,
        emoji: true,
        user: { select: { id: true, username: true, profilePicture: true } },
      },
    });

    const groupedByMessage: Record<
      number,
      {
        emoji: string;
        users: { id: number; username?: string; profilePicture?: string | null }[];
      }[]
    > = {};

    for (const r of allReactions) {
      const arr = (groupedByMessage[r.messageId] ||= []);
      const idx = arr.findIndex((g) => g.emoji === r.emoji);
      if (idx === -1) {
        arr.push({ emoji: r.emoji, users: [r.user] });
      } else {
        arr[idx].users.push(r.user);
      }
    }

    const enriched = messages.map((m) => {
      const grouped = groupedByMessage[m.id] || [];
      const pinInfo = pinnedMap.get(m.id) || null;

      return {
        ...m,
        groupedReactions: grouped.map((g) => ({
          emoji: g.emoji,
          count: g.users.length,
          users: g.users.map((u) => ({
            id: u.id,
            username: u.username,
            profilePicture: u.profilePicture,
          })),
        })),
        myReactions: grouped
          .filter((g) => g.users.some((u) => u.id === userId))
          .map((g) => g.emoji),

        isPinned: pinInfo !== null,
        pinnedAt: pinInfo,
      };
    });

    const resultMessages =
      direction === "backward" ? [...enriched].reverse() : enriched;

    const ids = messages.map((m) => m.id);
    const nextCursor =
      direction === "backward" ? Math.min(...ids) : Math.max(...ids);

    const hasMore = !!(await prisma.message.findFirst({
      where: {
        conversationId,
        isDeleted: false,
        ...(direction === "backward"
          ? { id: { lt: nextCursor } }
          : { id: { gt: nextCursor } }),
      },
      select: { id: true },
    }));

    if (markDelivered && messageIds.length > 0) {
      const now = new Date();

      const existingDeliveries = await prisma.messageDelivery.findMany({
        where: { userId, messageId: { in: messageIds } },
        select: { messageId: true, status: true },
      });
      const existingSet = new Map(
        existingDeliveries.map((d) => [d.messageId, d.status]),
      );

      const toInsert = messageIds.filter((mid) => !existingSet.has(mid));
      if (toInsert.length > 0) {
        await prisma.messageDelivery.createMany({
          data: toInsert.map((mid) => ({
            messageId: mid,
            userId,
            status: "delivered",
            timestamp: now,
          })),
          skipDuplicates: true,
        });
      }

      const toUpdate = messageIds.filter(
        (mid) => existingSet.get(mid) === "sent",
      );
      if (toUpdate.length > 0) {
        await prisma.messageDelivery.updateMany({
          where: {
            userId,
            messageId: { in: toUpdate },
            status: "sent",
          },
          data: { status: "delivered", timestamp: now },
        });
      }
    }

    return {
      messages: resultMessages,
      pageInfo: {
        hasMore,
        nextCursor,
        direction,
      },
    };
  } catch (error) {
    console.error("❌ Ошибка при получении сообщений чата:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось получить сообщения");
  }
};
