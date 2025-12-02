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

const CHAT_NOTIFICATION_TYPES = new Set<string>([
  "direct_message",
  "group_message",
  "message_mention",
  "message_reaction",
  "message_quote",
  "added_to_conversation",
]);

const isChatNotificationType = (type: NotificationType | string): boolean =>
  CHAT_NOTIFICATION_TYPES.has(String(type));

interface NotificationState {
  notifications: ApiNotification[];
  loading: boolean;
  error: string | null;

  unreadCount: number;
  chatUnreadCount: number;

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
  chatUnreadCount: 0,

  fetchNotifications: async () => {
    set({ loading: true, error: null });

    try {
      const data: ApiNotification[] = await getNotifications();

      const generalUnread = data.filter(
        (n) => !n.isRead && !isChatNotificationType(n.type)
      ).length;

      const chatUnread = data.filter(
        (n) => !n.isRead && isChatNotificationType(n.type)
      ).length;

      set({
        notifications: data,
        loading: false,
        error: null,
        unreadCount: generalUnread,
        chatUnreadCount: chatUnread,
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

    const generalUnread = updated.filter(
      (n) => !n.isRead && !isChatNotificationType(n.type)
    ).length;

    const chatUnread = updated.filter(
      (n) => !n.isRead && isChatNotificationType(n.type)
    ).length;

    set({
      notifications: updated,
      unreadCount: generalUnread,
      chatUnreadCount: chatUnread,
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

    const generalUnread = updated.filter(
      (n) => !n.isRead && !isChatNotificationType(n.type)
    ).length;

    const chatUnread = updated.filter(
      (n) => !n.isRead && isChatNotificationType(n.type)
    ).length;

    set({
      notifications: updated,
      unreadCount: generalUnread,
      chatUnreadCount: chatUnread,
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
    const index = prev.findIndex((n) => n.id === notification.id);

    let updated: ApiNotification[];

    if (index >= 0) {
      updated = [...prev];
      updated[index] = { ...prev[index], ...notification };
    } else {
      updated = [notification, ...prev];
    }

    const generalUnread = updated.filter(
      (n) => !n.isRead && !isChatNotificationType(n.type)
    ).length;

    const chatUnread = updated.filter(
      (n) => !n.isRead && isChatNotificationType(n.type)
    ).length;

    set({
      notifications: updated,
      unreadCount: generalUnread,
      chatUnreadCount: chatUnread,
    });
  },

  setAllReadLocal: () => {
    const prev = get().notifications;
    const updated = prev.map((n) => ({ ...n, isRead: true }));
    set({
      notifications: updated,
      unreadCount: 0,
      chatUnreadCount: 0,
    });
  },
}));