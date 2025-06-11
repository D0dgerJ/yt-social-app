import prisma from '../../../infrastructure/database/prismaClient.ts';

export const getUserConversations = async (userId: number) => {
  return prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId,
        },
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
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });
};

