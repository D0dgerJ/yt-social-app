import { createNotification } from "../../application/use-cases/notification/createNotification.js";
import { deleteNotification } from "../../application/use-cases/notification/deleteNotification.js";
import { getUserNotifications } from "../../application/use-cases/notification/getUserNotifications.js";
import { markNotificationAsRead } from "../../application/use-cases/notification/markNotificationAsRead.js";

export const create = async (req, res) => {
  try {
    const { toUserId, type, content } = req.body;
    const fromUserId = req.user.id;

    const notification = await createNotification(fromUserId, toUserId, type, content);
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await deleteNotification(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.id);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const updated = await markNotificationAsRead(req.params.id);
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
