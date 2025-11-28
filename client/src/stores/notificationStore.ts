import { create } from "zustand";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../utils/api/notification.api";
import type { NotificationType } from "../utils/types/notification";

export interface ApiUserShort {
  id: number;
  username: string;
  profilePicture?: string | null;
}

export interface ApiNotification {
  id: number;
  type: NotificationType | string;
  content?: string | null;
  isRead: boolean;
  createdAt: string;

  fromUserId: number;
  toUserId: number;
  fromUser: ApiUserShort;
}

interface NotificationState {
  notifications: ApiNotification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  removeNotification: (id: number) => Promise<void>;
  addNotification: (notification: ApiNotification) => void;
  setAllReadLocal: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  unreadCount: 0,

  fetchNotifications: async () => {
    set({ loading: true, error: null });

    try {
      const data: ApiNotification[] = await getNotifications();

      set({
        notifications: data,
        loading: false,
        error: null,
        unreadCount: data.filter((n) => !n.isRead).length,
      });
    } catch (e: any) {
      set({
        loading: false,
        error: e?.message || "Failed to load notifications",
      });
    }
  },

  markAsRead: async (id: number) => {
    const prev = get().notifications;

    const updated = prev.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.isRead).length,
    });

    try {
      await markNotificationAsRead(id);
    } catch (e) {
      console.error("[notificationStore] markAsRead error:", e);
      await get().fetchNotifications();
    }
  },

  removeNotification: async (id: number) => {
    const prev = get().notifications;
    const updated = prev.filter((n) => n.id !== id);

    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.isRead).length,
    });

    try {
      await deleteNotification(id);
    } catch (e) {
      console.error("[notificationStore] removeNotification error:", e);
      await get().fetchNotifications();
    }
  },

  addNotification: (notification: ApiNotification) => {
    const prev = get().notifications;

    if (prev.some((n) => n.id === notification.id)) {
      return;
    }

    const updated = [notification, ...prev];
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.isRead).length,
    });
  },

  setAllReadLocal: () => {
    const prev = get().notifications;
    const updated = prev.map((n) => ({ ...n, isRead: true }));
    set({ notifications: updated, unreadCount: 0 });
  },
}));
