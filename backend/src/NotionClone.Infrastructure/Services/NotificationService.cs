using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Notification;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly NotionDbContext _dbContext;

    public NotificationService(NotionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(Guid userId, CancellationToken ct = default)
    {
        var notifications = await _dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(ct);

        return notifications.Select(MapToNotificationDto);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default)
    {
        return await _dbContext.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead, ct);
    }

    public async Task<NotificationDto> MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken ct = default)
    {
        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, ct)
            ?? throw new NotFoundException($"Notification with ID '{notificationId}' was not found.");

        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);

        return MapToNotificationDto(notification);
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken ct = default)
    {
        var unreadNotifications = await _dbContext.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);

        if (unreadNotifications.Count > 0)
        {
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.UpdatedAt = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync(ct);
        }
    }

    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException("Notification title is required.");
        }

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Type = request.Type,
            Title = request.Title.Trim(),
            Message = request.Message?.Trim() ?? string.Empty,
            Link = request.Link,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync(ct);

        return MapToNotificationDto(notification);
    }

    public async Task DeleteNotificationAsync(Guid userId, Guid notificationId, CancellationToken ct = default)
    {
        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, ct)
            ?? throw new NotFoundException($"Notification with ID '{notificationId}' was not found.");

        _dbContext.Notifications.Remove(notification);
        await _dbContext.SaveChangesAsync(ct);
    }

    private static NotificationDto MapToNotificationDto(Notification n) =>
        new(
            n.Id,
            n.UserId,
            n.Type.ToString().ToLowerInvariant(),
            n.Title,
            n.Message,
            n.CreatedAt,
            n.IsRead,
            n.Link
        );
}
