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

      return {
        id: conv.id,
        name: conv.isGroup ? conv.name : participants[0]?.username || "Личный чат",
        isGroup: conv.isGroup,
        participants,
        lastMessage: conv.lastMessage && !conv.lastMessage.isDeleted
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
      };
    });

    return formatted;
  } catch (error) {
    console.error("❌ Ошибка при получении бесед пользователя:", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Не удалось получить список бесед");
  }
};
