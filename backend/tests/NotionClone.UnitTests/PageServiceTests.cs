using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Page;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;
using Xunit;

namespace NotionClone.UnitTests;

public class PageServiceTests
{
    private NotionDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<NotionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new NotionDbContext(options);
    }

    private async Task<(Guid userId, Guid workspaceId)> SetupWorkspaceAsync(NotionDbContext db)
    {
        var userId = Guid.NewGuid();
        var workspaceId = Guid.NewGuid();

        var user = new User { Id = userId, Email = "test@example.com", Name = "Test User" };
        var workspace = new Workspace { Id = workspaceId, Name = "Test Workspace", Slug = "test-workspace" };
        var member = new WorkspaceMember { Id = Guid.NewGuid(), WorkspaceId = workspaceId, UserId = userId, Role = UserRole.Owner };

        db.Users.Add(user);
        db.Workspaces.Add(workspace);
        db.WorkspaceMembers.Add(member);
        await db.SaveChangesAsync();

        return (userId, workspaceId);
    }

    [Fact]
    public async Task CreatePageAsync_ShouldCreatePageInWorkspace()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, workspaceId) = await SetupWorkspaceAsync(db);
        var service = new PageService(db);

        var request = new CreatePageRequest(null, "My First Page", "📝", null, null);

        // Act
        var result = await service.CreatePageAsync(userId, workspaceId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("My First Page", result.Title);
        Assert.Equal("📝", result.Icon);
        Assert.Equal(workspaceId, result.WorkspaceId);
        Assert.False(result.IsArchived);
    }

    [Fact]
    public async Task GetWorkspacePageTreeAsync_ShouldReturnHierarchicalTree()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, workspaceId) = await SetupWorkspaceAsync(db);
        var service = new PageService(db);

        var parent = await service.CreatePageAsync(userId, workspaceId, new CreatePageRequest(null, "Parent Page", null, null, null));
        var child = await service.CreatePageAsync(userId, workspaceId, new CreatePageRequest(parent.Id, "Child Page", null, null, null));

        // Act
        var tree = (await service.GetWorkspacePageTreeAsync(userId, workspaceId)).ToList();

        // Assert
        Assert.Single(tree);
        Assert.Equal("Parent Page", tree[0].Title);
        Assert.Single(tree[0].Children);
        Assert.Equal("Child Page", tree[0].Children[0].Title);
    }

    [Fact]
    public async Task MovePageAsync_MoveToChild_ShouldThrowValidationException()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, workspaceId) = await SetupWorkspaceAsync(db);
        var service = new PageService(db);

        var parent = await service.CreatePageAsync(userId, workspaceId, new CreatePageRequest(null, "Parent Page", null, null, null));
        var child = await service.CreatePageAsync(userId, workspaceId, new CreatePageRequest(parent.Id, "Child Page", null, null, null));

        // Act & Assert (attempting to move parent under child)
        await Assert.ThrowsAsync<ValidationException>(() =>
            service.MovePageAsync(userId, parent.Id, new MovePageRequest(child.Id)));
    }

    [Fact]
    public async Task SoftDeletePageAsync_ShouldArchivePageAndDescendants()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, workspaceId) = await SetupWorkspaceAsync(db);
        var service = new PageService(db);

        var parent = await service.CreatePageAsync(userId, workspaceId, new CreatePageRequest(null, "Parent", null, null, null));
        var child = await service.CreatePageAsync(userId, workspaceId, new CreatePageRequest(parent.Id, "Child", null, null, null));

        // Act
        await service.SoftDeletePageAsync(userId, parent.Id);

        // Assert
        var updatedParent = await db.Pages.FindAsync(parent.Id);
        var updatedChild = await db.Pages.FindAsync(child.Id);

        Assert.True(updatedParent!.IsArchived);
        Assert.True(updatedChild!.IsArchived);
    }

    [Fact]
    public async Task DuplicatePageAsync_ShouldDuplicatePageAndSubtree()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, workspaceId) = await SetupWorkspaceAsync(db);
        var service = new PageService(db);

        var parent = await service.CreatePageAsync(userId, workspaceId, new CreatePageRequest(null, "Original", null, null, null));
        await service.CreatePageAsync(userId, workspaceId, new CreatePageRequest(parent.Id, "Original Child", null, null, null));

        // Act
        var duplicated = await service.DuplicatePageAsync(userId, parent.Id);

        // Assert
        Assert.Equal("Original (Copy)", duplicated.Title);

        var childrenOfCopy = await db.Pages.Where(p => p.ParentId == duplicated.Id).ToListAsync();
        Assert.Single(childrenOfCopy);
        Assert.Equal("Original Child", childrenOfCopy[0].Title);
    }
}
