import axios from "./axiosInstance";
import type { NotificationType } from "../types/notification";

export interface CreateNotificationRequest {
  receiverId: number;
  type: NotificationType;
  payload?: Record<string, unknown>;
}

export const createNotification = async (data: CreateNotificationRequest) => {
  const response = await axios.post("/notifications", data);
  return response.data;
};

export const getNotifications = async () => {
  const response = await axios.get("/notifications");
  return response.data;
};

export const markNotificationAsRead = async (notificationId: number) => {
  const response = await axios.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const deleteNotification = async (notificationId: number) => {
  const response = await axios.delete(`/notifications/${notificationId}`);
  return response.data;
};
