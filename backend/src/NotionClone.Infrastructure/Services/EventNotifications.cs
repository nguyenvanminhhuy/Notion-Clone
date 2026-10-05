using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

internal static class EventNotifications
{
    public static void Add(NotionDbContext db, Guid actorId, Guid recipientId,
        NotificationType type, string title, string message, string link)
    {
        if (actorId == recipientId) return;
        db.Notifications.Add(new Notification
        {
            UserId = recipientId, Type = type, Title = title, Message = message, Link = link
        });
    }

    public static async Task CommentAsync(NotionDbContext db, IPageAuthorizationService authorization,
        Guid actorId, Guid recipientId, Guid pageId, bool reply, CancellationToken ct)
    {
        if (actorId != recipientId &&
            await authorization.HasPagePermissionAsync(recipientId, pageId, PagePermission.Read, ct))
            Add(db, actorId, recipientId, NotificationType.Comment,
                reply ? "New reply" : "New comment", "There is a new comment on a page you can access.", $"/page/{pageId}");
    }
}
