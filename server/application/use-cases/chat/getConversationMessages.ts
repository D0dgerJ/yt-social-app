import prisma from "../../../infrastructure/database/prismaClient.ts";

interface GetConversationMessagesInput {
  conversationId: number;
  page?: number;       // номер страницы (по умолчанию 1)
  limit?: number;      // количество сообщений на страницу (по умолчанию 20)
}

export const getConversationMessages = async ({
  conversationId,
  page = 1,
  limit = 20,
}: GetConversationMessagesInput) => {
  const offset = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: { conversationId },
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
          content: true,
          mediaUrl: true,
          senderId: true,
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
    where: { conversationId },
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
};