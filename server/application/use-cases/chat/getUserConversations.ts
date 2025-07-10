import prisma from '../../../infrastructure/database/prismaClient.ts';

export const getUserConversations = async (userId: number) => {
  try {
    // Проверка: пользователь существует (опционально, но полезно для стабильности)
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new Error("Пользователь не найден");
    }

    // Получаем беседы пользователя
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          select: {
            isOnline: true,
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
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            encryptedContent: true,
            mediaUrl: true,
            mediaType: true,
            createdAt: true,
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
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return conversations;
  } catch (error) {
    console.error("❌ Ошибка при получении бесед пользователя:", error);
    throw new Error("Не удалось получить список бесед");
  }
};
