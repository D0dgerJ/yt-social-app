import prisma from "../../../infrastructure/database/prismaClient.js";

export const createNotification = async (fromUserId, toUserId, type, content = null) => {
  const notification = await prisma.notification.create({
    data: {
      type,
      content,
      fromUserId: Number(fromUserId),
      toUserId: Number(toUserId),
    },
  });

  return notification;
};
