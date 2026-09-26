using Microsoft.EntityFrameworkCore;
using NotionClone.Application.DTOs.Notification;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;
using Xunit;

namespace NotionClone.UnitTests;

public class NotificationServiceTests
{
    private NotionDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<NotionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new NotionDbContext(options);
    }

    [Fact]
    public async Task NotificationLifecycle_ShouldWorkAsExpected()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "notify@example.com", Name = "Notify User" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new NotificationService(db);

        // Act 1: Create notifications
        await service.CreateNotificationAsync(new CreateNotificationRequest(
            userId,
            NotificationType.Comment,
            "New comment on your page",
            "Someone commented on your doc",
            "/pages/123"
        ));

        await service.CreateNotificationAsync(new CreateNotificationRequest(
            userId,
            NotificationType.Share,
            "Page shared with you",
            "You were invited to edit",
            "/pages/456"
        ));

        // Act 2: Check unread count
        var count = await service.GetUnreadCountAsync(userId);
        Assert.Equal(2, count);

        // Act 3: List notifications
        var list = (await service.GetUserNotificationsAsync(userId)).ToList();
        Assert.Equal(2, list.Count);
        Assert.False(list[0].Read);
        Assert.False(list[1].Read);

        // Act 4: Mark single as read
        var updated = await service.MarkAsReadAsync(userId, list[0].Id);
        Assert.True(updated.Read);
        var countAfterSingleRead = await service.GetUnreadCountAsync(userId);
        Assert.Equal(1, countAfterSingleRead);

        // Act 5: Mark all as read
        await service.MarkAllAsReadAsync(userId);
        var countAfterAllRead = await service.GetUnreadCountAsync(userId);
        Assert.Equal(0, countAfterAllRead);
    }
}
