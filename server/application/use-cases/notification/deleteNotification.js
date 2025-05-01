import prisma from "../../../infrastructure/database/prismaClient.js";

export const deleteNotification = async (notificationId) => {
  await prisma.notification.delete({
    where: { id: Number(notificationId) },
  });
};
