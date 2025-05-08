import prisma from '../../../infrastructure/database/prismaClient';

export const getUserNotifications = async (userId: number) => {
  if (!userId || userId <= 0) {
    throw new Error('Invalid user ID');
  }

  return prisma.notification.findMany({
    where: { toUserId: userId },
    orderBy: { createdAt: 'desc' },
    include: { fromUser: true },
  });
};