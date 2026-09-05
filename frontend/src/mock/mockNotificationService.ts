import type { Notification } from '../types/notification';

let store: Notification[] = [
  {
    id: 'n1',
    userId: 'user-1',
    type: 'system',
    title: 'Welcome to Notion Clone!',
    message: 'We are glad to have you here. Start by creating a new page.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    userId: 'user-1',
    type: 'comment',
    title: 'New comment on "Project Roadmap"',
    message: 'user-2 replied: "This looks like a great start!"',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    link: '/page/page-1',
  },
  {
    id: 'n3',
    userId: 'user-1',
    type: 'mention',
    title: 'You were mentioned',
    message: 'user-2 mentioned you in "Design Specs"',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    read: true,
    link: '/page/page-2',
  },
];

function delay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockNotificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    await delay();
    return store.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markAsRead(notificationId: string): Promise<void> {
    await delay();
    const notification = store.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    await delay();
    store.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
  }
};
