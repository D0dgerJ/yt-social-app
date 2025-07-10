import prisma from "../../../infrastructure/database/prismaClient.ts";

interface GetConversationMessagesInput {
  conversationId: number;
  page?: number;
  limit?: number;
  userId: number;
}

export const getConversationMessages = async ({
  conversationId,
  page = 1,
  limit = 20,
  userId,
}: GetConversationMessagesInput) => {
  try {
    //  Проверка: участвует ли пользователь в чате
    const isParticipant = await prisma.participant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!isParticipant) {
      throw new Error("Вы не имеете доступа к этому чату");
    }

    const offset = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        repliedTo: {
          select: {
            id: true,
            encryptedContent: true,
            mediaUrl: true,
            senderId: true,
            isDeleted: true,
          },
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    const totalMessages = await prisma.message.count({
      where: {
        conversationId,
        isDeleted: false,
      },
    });

    return {
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
      },
    };
  } catch (error) {
    console.error("❌ Ошибка при получении сообщений чата:", error);
    throw new Error("Не удалось получить сообщения");
  }
};
