using NotionClone.Domain.Enums;

namespace NotionClone.Application.DTOs.Notification;

public record NotificationDto(
    Guid Id,
    Guid UserId,
    string Type,
    string Title,
    string Message,
    DateTime CreatedAt,
    bool Read,
    string? Link
);

public record CreateNotificationRequest(
    Guid UserId,
    NotificationType Type,
    string Title,
    string Message,
    string? Link
);
