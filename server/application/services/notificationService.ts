import prisma from '../../infrastructure/database/prismaClient';

export const sendNotification = async (receiverId: number, type: string, senderId: number) => {
  const notification = await prisma.notification.create({
    data: {
      receiverId,
      type,
      senderId,
    },
  });

  return notification;
};

export const deleteNotification = async (id: number) => {
  return prisma.notification.delete({
    where: { id },
  });
};
