using NotionClone.Domain.Common;
using NotionClone.Domain.Enums;

namespace NotionClone.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; } = NotificationType.System;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Link { get; set; }
    public bool IsRead { get; set; } = false;

    public User User { get; set; } = null!;
}
