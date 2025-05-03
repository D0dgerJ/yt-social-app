import { Request, Response } from "express";
import { getUserNotifications } from "../../application/use-cases/notification/getUserNotifications";
import { markNotificationAsRead } from "../../application/use-cases/notification/markNotificationAsRead";
import { createNotification } from "../../application/use-cases/notification/createNotification";

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
    const senderId = req.user!.id;
    const { receiverId, type } = req.body;
    const notification = await createNotification({ senderId, receiverId, type });
    res.status(201).json(notification);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
