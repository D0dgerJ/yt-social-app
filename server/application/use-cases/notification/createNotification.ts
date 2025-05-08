import prisma from '../../../infrastructure/database/prismaClient';

interface CreateNotificationInput {
  fromUserId: number;
  toUserId: number;
  type: string;
  content?: string;
}

export const createNotification = async ({
  fromUserId,
  toUserId,
  type,
  content,
}: CreateNotificationInput) => {
  return prisma.notification.create({
    data: {
      fromUserId,
      toUserId,
      type,
      content,
    },
  });
};
