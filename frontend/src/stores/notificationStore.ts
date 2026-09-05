import { create } from 'zustand';
import { mockNotificationService } from '../mock/mockNotificationService';
import type { Notification } from '../types/notification';

interface NotificationStore {
  notifications: Notification[];
  isLoading: boolean;
  loadNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isLoading: false,

  loadNotifications: async (userId) => {
    set({ isLoading: true });
    try {
      const data = await mockNotificationService.getNotifications(userId);
      set({ notifications: data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await mockNotificationService.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      }));
    } catch (error) {
      console.error(error);
    }
  },

  markAllAsRead: async (userId) => {
    try {
      await mockNotificationService.markAllAsRead(userId);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      }));
    } catch (error) {
      console.error(error);
    }
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.read).length;
  }
}));
