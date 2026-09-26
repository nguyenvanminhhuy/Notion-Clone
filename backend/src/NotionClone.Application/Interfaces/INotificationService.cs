using NotionClone.Application.DTOs.Notification;

namespace NotionClone.Application.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(Guid userId, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);
    Task<NotificationDto> MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken ct = default);
    Task MarkAllAsReadAsync(Guid userId, CancellationToken ct = default);
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationRequest request, CancellationToken ct = default);
    Task DeleteNotificationAsync(Guid userId, Guid notificationId, CancellationToken ct = default);
}
