import prisma from "../../../infrastructure/database/prismaClient.js";

export const getUserNotifications = async (userId) => {
  const notifications = await prisma.notification.findMany({
    where: {
      toUserId: Number(userId),
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      fromUser: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
  });

  return notifications;
};
