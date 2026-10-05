import { httpClient } from './api/httpClient';
import type { Notification, NotificationType } from '../types/notification';

// Backend DTO shape (camelCase from ASP.NET Core JSON serialization)
interface BackendNotificationDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string | null;
}

interface UnreadCountResponse {
  count: number;
}

const VALID_TYPES: NotificationType[] = ['comment', 'mention', 'share', 'system'];

function mapNotification(dto: BackendNotificationDto): Notification {
  const type: NotificationType = VALID_TYPES.includes(dto.type as NotificationType)
    ? (dto.type as NotificationType)
    : 'system';

  return {
    id: dto.id,
    userId: dto.userId,
    type,
    title: dto.title,
    message: dto.message,
    createdAt: dto.createdAt,
    read: Boolean(dto.read),
    link: dto.link ?? undefined,
  };
}

export const notificationService = {
  /**
   * Fetch all notifications for the currently authenticated user.
   * GET /api/notifications
   */
  async getNotifications(): Promise<Notification[]> {
    const list = await httpClient.get<BackendNotificationDto[]>('/api/notifications');
    return list.map(mapNotification);
  },

  /**
   * Get the count of unread notifications.
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(): Promise<number> {
    const data = await httpClient.get<UnreadCountResponse>('/api/notifications/unread-count');
    return data.count;
  },

  /**
   * Mark a specific notification as read.
   * PATCH /api/notifications/{id}/read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const dto = await httpClient.patch<BackendNotificationDto>(
      `/api/notifications/${notificationId}/read`
    );
    return mapNotification(dto);
  },

  /**
   * Mark all notifications for the current user as read.
   * POST /api/notifications/read-all
   */
  async markAllAsRead(): Promise<void> {
    await httpClient.post('/api/notifications/read-all');
  },

  /**
   * Delete a notification.
   * DELETE /api/notifications/{id}
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await httpClient.delete(`/api/notifications/${notificationId}`);
  },
};
