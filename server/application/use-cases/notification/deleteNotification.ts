import prisma from '../../../infrastructure/database/prismaClient.js';

export const deleteNotification = async (notificationId: number) => {
  return prisma.notification.delete({
    where: { id: notificationId },
  });
};
