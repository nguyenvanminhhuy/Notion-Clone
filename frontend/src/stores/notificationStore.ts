import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types/notification';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  /** Load all notifications for the current user. */
  loadNotifications: () => Promise<void>;
  /** Fetch the unread count from the API. */
  fetchUnreadCount: () => Promise<void>;
  /** Mark a single notification as read (optimistic). */
  markAsRead: (notificationId: string) => Promise<void>;
  /** Mark all notifications as read (optimistic). */
  markAllAsRead: () => Promise<void>;
  /** Delete a notification (optimistic). */
  deleteNotification: (notificationId: string) => Promise<void>;
  /** Derived: count unread from local state. */
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  loadNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await notificationService.getNotifications();
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.read).length,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      console.error('[notificationStore] loadNotifications:', err);
      set({ isLoading: false, error: message });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch (err) {
      console.error('[notificationStore] fetchUnreadCount:', err);
    }
  },

  markAsRead: async (notificationId) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.error('[notificationStore] markAsRead:', err);
      // Rollback on failure
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: false } : n
        ),
        unreadCount: state.unreadCount + 1,
      }));
    }
  },

  markAllAsRead: async () => {
    // Optimistic update
    const prevNotifications = get().notifications;
    const prevUnreadCount = get().unreadCount;
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('[notificationStore] markAllAsRead:', err);
      // Rollback on failure
      set({ notifications: prevNotifications, unreadCount: prevUnreadCount });
    }
  },

  deleteNotification: async (notificationId) => {
    // Optimistic removal
    const prevNotifications = get().notifications;
    const prevUnreadCount = get().unreadCount;
    const target = prevNotifications.find((n) => n.id === notificationId);

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
      unreadCount: target && !target.read
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));

    try {
      await notificationService.deleteNotification(notificationId);
    } catch (err) {
      console.error('[notificationStore] deleteNotification:', err);
      // Rollback on failure
      set({ notifications: prevNotifications, unreadCount: prevUnreadCount });
    }
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));
