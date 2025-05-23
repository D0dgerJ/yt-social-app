import { Request, Response } from "express";
import { getUserNotifications } from "../../application/use-cases/notification/getUserNotifications.ts";
import { markNotificationAsRead } from "../../application/use-cases/notification/markNotificationAsRead.ts";
import { createNotification } from "../../application/use-cases/notification/createNotification.ts";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = await getUserNotifications(userId);
    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.body;
    const updated = await markNotificationAsRead(notificationId);
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const fromUserId = req.user!.id;
    const { receiverId: toUserId, type, content } = req.body;

    const notification = await createNotification({
      fromUserId,
      toUserId,
      type,
      content,
    });

    res.status(201).json(notification);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
