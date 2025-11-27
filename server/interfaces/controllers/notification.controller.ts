import { Request, Response } from "express";
import { getUserNotifications } from "../../application/use-cases/notification/getUserNotifications.ts";
import { markNotificationAsRead } from "../../application/use-cases/notification/markNotificationAsRead.ts";
import { createNotification } from "../../application/use-cases/notification/createNotification.ts";
import { deleteNotification } from "../../application/use-cases/notification/deleteNotification.ts";
import type { NotificationType } from "../../application/use-cases/notification/notificationTypes.ts";

interface AuthedRequest extends Request {
  user?: { id: number };
}

// GET /notifications
export const getNotifications = async (
  req: AuthedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId || userId <= 0) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const notifications = await getUserNotifications(userId);
    res.status(200).json(notifications);
  } catch (error: any) {
    console.error("[notifications] getNotifications error:", error);
    res
      .status(500)
      .json({ message: error?.message || "Failed to load notifications" });
  }
};

// PUT /notifications/:id/read
export const markAsRead = async (
  req: AuthedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ message: "Invalid notification id" });
      return;
    }

    const updated = await markNotificationAsRead(id);
    res.status(200).json(updated);
  } catch (error: any) {
    console.error("[notifications] markAsRead error:", error);
    res
      .status(500)
      .json({ message: error?.message || "Failed to mark as read" });
  }
};

// POST /notifications
export const create = async (
  req: AuthedRequest,
  res: Response
): Promise<void> => {
  try {
    const fromUserId = req.user?.id;

    if (!fromUserId || fromUserId <= 0) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { receiverId, type, payload } = req.body as {
      receiverId: unknown;
      type: NotificationType;
      payload?: Record<string, unknown>;
    };

    const toUserId = Number(receiverId);

    if (!Number.isFinite(toUserId) || toUserId <= 0) {
      res.status(400).json({ message: "Invalid receiverId" });
      return;
    }

    const safePayload =
      payload && typeof payload === "object" ? payload : undefined;

    const notification = await createNotification({
      fromUserId,
      toUserId,
      type,
      payload: safePayload,
    });

    res.status(201).json(notification);
  } catch (error: any) {
    console.error("[notifications] create error:", error);
    res
      .status(500)
      .json({ message: error?.message || "Failed to create notification" });
  }
};

// DELETE /notifications/:id
export const remove = async (
  req: AuthedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      res.status(400).json({ message: "Invalid notification id" });
      return;
    }

    await deleteNotification(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("[notifications] remove error:", error);
    res
      .status(500)
      .json({ message: error?.message || "Failed to delete notification" });
  }
};
