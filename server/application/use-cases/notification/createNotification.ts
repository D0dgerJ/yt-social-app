import prisma from '../../../infrastructure/database/prismaClient';

interface CreateNotificationInput {
  receiverId: number;
  senderId: number;
  type: string;
}

export const createNotification = async ({ receiverId, senderId, type }: CreateNotificationInput) => {
  return prisma.notification.create({
    data: {
      toUserId: receiverId,
      fromUserId: senderId,
      type,
    },
  });
};
