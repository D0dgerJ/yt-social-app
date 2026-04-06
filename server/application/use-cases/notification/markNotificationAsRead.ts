import prisma from '../../../infrastructure/database/prismaClient.js';

export const markNotificationAsRead = async (notificationId: number) => {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};
