import prisma from '../../../infrastructure/database/prismaClient.ts';

export const deleteNotification = async (notificationId: number) => {
  return prisma.notification.delete({
    where: { id: notificationId },
  });
};
