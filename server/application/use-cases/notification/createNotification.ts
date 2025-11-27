import prisma from "../../../infrastructure/database/prismaClient.ts";
import type { NotificationType } from "./notificationTypes.ts";

export interface CreateNotificationInput {
  fromUserId: number;
  toUserId: number;
  type: NotificationType;
  payload?: Record<string, unknown>;
}

export const createNotification = async ({
  fromUserId,
  toUserId,
  type,
  payload,
}: CreateNotificationInput) => {
  if (fromUserId === toUserId) {
    return null;
  }

  const content = payload ? JSON.stringify(payload) : undefined;

  return prisma.notification.create({
    data: {
      fromUserId,
      toUserId,
      type,
      content,
    },
  });
};