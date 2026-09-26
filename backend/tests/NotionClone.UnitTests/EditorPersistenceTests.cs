using Microsoft.EntityFrameworkCore;
using NotionClone.Application.DTOs.Page;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;
using Xunit;

namespace NotionClone.UnitTests;

public class EditorPersistenceTests
{
    private NotionDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<NotionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new NotionDbContext(options);
    }

    private async Task<(Guid userId, Guid workspaceId, Guid pageId)> SetupPageAsync(NotionDbContext db)
    {
        var userId = Guid.NewGuid();
        var workspaceId = Guid.NewGuid();
        var pageId = Guid.NewGuid();

        var user = new User { Id = userId, Email = "editor@example.com", Name = "Editor User" };
        var workspace = new Workspace { Id = workspaceId, Name = "Editor Workspace", Slug = "editor-workspace" };
        var member = new WorkspaceMember { Id = Guid.NewGuid(), WorkspaceId = workspaceId, UserId = userId, Role = UserRole.Owner };
        var page = new Page
        {
            Id = pageId,
            WorkspaceId = workspaceId,
            Title = "Editor Test Page",
            Content = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Initial Content\"}]}]}",
            CreatedById = userId,
            LastEditedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        db.Workspaces.Add(workspace);
        db.WorkspaceMembers.Add(member);
        db.Pages.Add(page);
        await db.SaveChangesAsync();

        return (userId, workspaceId, pageId);
    }

    [Fact]
    public async Task UpdatePageContent_ShouldPersistContentAndCreateVersionSnapshot()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var service = new PageService(db);

        var newContent = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Updated Content\"}]}]}";

        // Act
        var result = await service.UpdatePageContentAsync(userId, pageId, new UpdatePageContentRequest(newContent));

        // Assert
        Assert.Equal(newContent, result.Content);

        var page = await db.Pages.FindAsync(pageId);
        Assert.Equal(newContent, page!.Content);

        var versions = await db.PageVersions.Where(pv => pv.PageId == pageId).ToListAsync();
        Assert.Single(versions);
        Assert.Equal(newContent, versions[0].Content);
    }

    [Fact]
    public async Task GetPageContent_ShouldReturnCurrentContent()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var service = new PageService(db);

        // Act
        var content = await service.GetPageContentAsync(userId, pageId);

        // Assert
        Assert.Contains("Initial Content", content);
    }

    [Fact]
    public async Task RestorePageVersion_ShouldRestoreContentToSpecifiedVersion()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var service = new PageService(db);

        var v1Content = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Version 1 Content\"}]}]}";
        var v2Content = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Version 2 Content\"}]}]}";

        await service.UpdatePageContentAsync(userId, pageId, new UpdatePageContentRequest(v1Content));
        var versions = (await service.GetPageVersionsAsync(userId, pageId)).ToList();
        var v1Id = versions[0].Id;

        await service.UpdatePageContentAsync(userId, pageId, new UpdatePageContentRequest(v2Content));

        // Act: restore v1
        var restoredPage = await service.RestorePageVersionAsync(userId, pageId, v1Id);

        // Assert
        Assert.Equal(v1Content, restoredPage.Content);
        var currentContent = await service.GetPageContentAsync(userId, pageId);
        Assert.Equal(v1Content, currentContent);
    }
}
