import prisma from "../../../infrastructure/database/prismaClient.js";

export const markNotificationAsRead = async (notificationId) => {
  const updated = await prisma.notification.update({
    where: { id: Number(notificationId) },
    data: { isRead: true },
  });

  return updated;
};
