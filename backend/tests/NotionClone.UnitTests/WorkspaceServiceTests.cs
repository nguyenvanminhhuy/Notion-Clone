using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Workspace;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;
using Xunit;

namespace NotionClone.UnitTests;

public class WorkspaceServiceTests
{
    private NotionDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<NotionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new NotionDbContext(options);
    }

    [Fact]
    public async Task CreateWorkspaceAsync_ShouldCreateWorkspaceAndAddOwner()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "owner@example.com", Name = "Owner" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new WorkspaceService(db);
        var request = new CreateWorkspaceRequest("My Workspace", "🚀", null);

        // Act
        var result = await service.CreateWorkspaceAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("My Workspace", result.Name);
        Assert.Equal("my-workspace", result.Slug);
        Assert.Equal("🚀", result.IconEmoji);

        var member = await db.WorkspaceMembers.FirstOrDefaultAsync(wm => wm.WorkspaceId == result.Id && wm.UserId == userId);
        Assert.NotNull(member);
        Assert.Equal(UserRole.Owner, member.Role);
    }

    [Fact]
    public async Task GetUserWorkspacesAsync_ShouldReturnOnlyUserWorkspaces()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var service = new WorkspaceService(db);

        await service.CreateWorkspaceAsync(userId, new CreateWorkspaceRequest("Workspace 1", null, null));
        await service.CreateWorkspaceAsync(userId, new CreateWorkspaceRequest("Workspace 2", null, null));
        await service.CreateWorkspaceAsync(Guid.NewGuid(), new CreateWorkspaceRequest("Other Workspace", null, null));

        // Act
        var result = (await service.GetUserWorkspacesAsync(userId)).ToList();

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetWorkspaceByIdAsync_NonMember_ShouldThrowForbiddenException()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();
        var nonMemberId = Guid.NewGuid();
        var service = new WorkspaceService(db);

        var ws = await service.CreateWorkspaceAsync(ownerId, new CreateWorkspaceRequest("Test Workspace", null, null));

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() => service.GetWorkspaceByIdAsync(nonMemberId, ws.Id));
    }

    [Fact]
    public async Task DeleteWorkspaceAsync_NonOwner_ShouldThrowForbiddenException()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var ownerId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var memberUser = new User { Id = memberId, Email = "member@example.com", Name = "Member" };
        db.Users.Add(memberUser);
        await db.SaveChangesAsync();

        var service = new WorkspaceService(db);
        var ws = await service.CreateWorkspaceAsync(ownerId, new CreateWorkspaceRequest("Test Workspace", null, null));

        await service.AddMemberAsync(ownerId, ws.Id, new InviteMemberRequest("member@example.com", UserRole.Member));

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() => service.DeleteWorkspaceAsync(memberId, ws.Id));
    }
}
