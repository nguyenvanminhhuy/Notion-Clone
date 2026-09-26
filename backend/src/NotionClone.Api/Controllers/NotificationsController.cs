using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.DTOs.Notification;
using NotionClone.Application.Interfaces;

namespace NotionClone.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/notifications")]
public class NotificationsController : ApiControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    /// <summary>Get all notifications for the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<NotificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(CancellationToken ct)
    {
        var notifications = await _notificationService.GetUserNotificationsAsync(CurrentUserId, ct);
        return Ok(notifications);
    }

    /// <summary>Get count of unread notifications.</summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var count = await _notificationService.GetUnreadCountAsync(CurrentUserId, ct);
        return Ok(new { count });
    }

    /// <summary>Mark a notification as read.</summary>
    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(typeof(NotificationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var notification = await _notificationService.MarkAsReadAsync(CurrentUserId, id, ct);
        return Ok(notification);
    }

    /// <summary>Mark all notifications for the authenticated user as read.</summary>
    [HttpPost("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        await _notificationService.MarkAllAsReadAsync(CurrentUserId, ct);
        return NoContent();
    }

    /// <summary>Delete a notification.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNotification(Guid id, CancellationToken ct)
    {
        await _notificationService.DeleteNotificationAsync(CurrentUserId, id, ct);
        return NoContent();
    }
}
