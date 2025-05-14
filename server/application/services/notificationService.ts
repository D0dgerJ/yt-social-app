import prisma from '../../infrastructure/database/prismaClient.ts';

export const sendNotification = async (
  receiverId: number,
  type: string,
  senderId: number
) => {
  const notification = await prisma.notification.create({
    data: {
      toUserId: receiverId,
      fromUserId: senderId,
      type,
    },
  });

  return notification;
};

export const deleteNotification = async (id: number) => {
  return prisma.notification.delete({
    where: { id },
  });
};
