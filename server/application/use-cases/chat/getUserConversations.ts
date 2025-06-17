import prisma from '../../../infrastructure/database/prismaClient.ts';

export const getUserConversations = async (userId: number) => {
  return prisma.conversation.findMany({
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
          content: true,
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
};


