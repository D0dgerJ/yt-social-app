import prisma from "../../../infrastructure/database/prismaClient.ts";
import { getIO } from "../../../infrastructure/websocket/socket.ts";
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

  const notification = await prisma.notification.create({
    data: {
      fromUserId,
      toUserId,
      type,
      content,
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

  try {
    const io = getIO();
    const room = `user:${toUserId}`;
    io.to(room).emit("notification:new", notification);
  } catch (err) {
    console.error("[notification] WS emit error:", err);
  }

  return notification;
};