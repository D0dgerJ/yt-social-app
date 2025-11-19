import prisma from "../../../infrastructure/database/prismaClient.ts";

export const getUserConversations = async (userId: number) => {
  try {
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new Error("Пользователь не найден");
    }

    const pinnedConversations = await prisma.pinnedConversation.findMany({
      where: { userId },
      select: {
        conversationId: true,
        pinnedAt: true,
      },
    });

    const pinnedMap = new Map<number, Date>();
    pinnedConversations.forEach((p) => {
      pinnedMap.set(p.conversationId, p.pinnedAt);
    });

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
        lastMessage: {
          select: {
            id: true,
            encryptedContent: true,
            mediaUrl: true,
            mediaType: true,
            createdAt: true,
            isDeleted: true,
            sender: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = conversations.map((conv) => {
      const participants = conv.participants
        .filter((p) => p.user.id !== userId)
        .map((p) => ({
          id: p.user.id,
          username: p.user.username,
          profilePicture: p.user.profilePicture,
          isOnline: p.isOnline,
        }));

      const pinnedAt = pinnedMap.get(conv.id) || null;
      const isPinned = pinnedAt !== null;

      return {
        id: conv.id,
        name: conv.isGroup ? conv.name : participants[0]?.username || "Личный чат",
        isGroup: conv.isGroup,
        participants,
        lastMessage:
          conv.lastMessage && !conv.lastMessage.isDeleted
            ? {
                id: conv.lastMessage.id,
                sender: conv.lastMessage.sender,
                mediaType: conv.lastMessage.mediaType,
                encryptedContent: conv.lastMessage.encryptedContent,
                mediaUrl: conv.lastMessage.mediaUrl,
                createdAt: conv.lastMessage.createdAt,
              }
            : null,
        updatedAt: conv.updatedAt,

        isPinned,
        pinnedAt,
      };
    });

    const sorted = [...formatted].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (a.isPinned && b.isPinned) {
        const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        return bTime - aTime; 
      }

      const aUpdated = new Date(a.updatedAt).getTime();
      const bUpdated = new Date(b.updatedAt).getTime();
      return bUpdated - aUpdated;
    });

    return sorted;
  } catch (error) {
    console.error("❌ Ошибка при получении бесед пользователя:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось получить список бесед");
  }
};
