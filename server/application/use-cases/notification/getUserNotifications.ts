import prisma from '../../../infrastructure/database/prismaClient';

export const getUserNotifications = async (userId: number) => {
  return prisma.notification.findMany({
    where: { toUserId: userId },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      fromUser: true,
    },
  });
};
