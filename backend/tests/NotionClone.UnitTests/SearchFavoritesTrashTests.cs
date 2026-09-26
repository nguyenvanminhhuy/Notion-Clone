using Microsoft.EntityFrameworkCore;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;
using Xunit;

namespace NotionClone.UnitTests;

public class SearchFavoritesTrashTests
{
    private NotionDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<NotionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new NotionDbContext(options);
    }

    private async Task<(Guid userId, Guid workspaceId, Page parent, Page child, Page archived)> SetupWorkspaceWithPagesAsync(NotionDbContext db)
    {
        var userId = Guid.NewGuid();
        var workspaceId = Guid.NewGuid();

        var user = new User { Id = userId, Email = "searcher@example.com", Name = "Search User" };
        var workspace = new Workspace { Id = workspaceId, Name = "Search Workspace", Slug = "search-workspace" };
        var member = new WorkspaceMember { Id = Guid.NewGuid(), WorkspaceId = workspaceId, UserId = userId, Role = UserRole.Owner };

        var parentPage = new Page
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            Title = "Project Roadmap",
            Content = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Overview of our quarter plans.\"}]}]}",
            IsFavorite = true,
            IsArchived = false,
            CreatedById = userId,
            LastEditedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var childPage = new Page
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            ParentId = parentPage.Id,
            Title = "Sprint Backlog",
            Content = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Detailed tasks for authentication feature.\"}]}]}",
            IsFavorite = false,
            IsArchived = false,
            CreatedById = userId,
            LastEditedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var archivedPage = new Page
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            Title = "Old Deprecated Plan",
            Content = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Obsolete tasks.\"}]}]}",
            IsFavorite = false,
            IsArchived = true,
            CreatedById = userId,
            LastEditedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        db.Workspaces.Add(workspace);
        db.WorkspaceMembers.Add(member);
        db.Pages.AddRange(parentPage, childPage, archivedPage);
        await db.SaveChangesAsync();

        return (userId, workspaceId, parentPage, childPage, archivedPage);
    }

    [Fact]
    public async Task SearchPagesAsync_TitleMatch_ShouldReturnTitleResult()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, workspaceId, _, _, _) = await SetupWorkspaceWithPagesAsync(db);
        var searchService = new SearchService(db);

        // Act
        var results = (await searchService.SearchPagesAsync(userId, workspaceId, "Roadmap")).ToList();

        // Assert
        Assert.Single(results);
        Assert.Equal("Project Roadmap", results[0].Page.Title);
        Assert.Equal("title", results[0].MatchType);
        Assert.Empty(results[0].Breadcrumbs);
    }

    [Fact]
    public async Task SearchPagesAsync_ContentMatchWithBreadcrumbs_ShouldReturnContentSnippetAndBreadcrumb()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, workspaceId, _, _, _) = await SetupWorkspaceWithPagesAsync(db);
        var searchService = new SearchService(db);

        // Act
        var results = (await searchService.SearchPagesAsync(userId, workspaceId, "authentication")).ToList();

        // Assert
        Assert.Single(results);
        Assert.Equal("Sprint Backlog", results[0].Page.Title);
        Assert.Equal("content", results[0].MatchType);
        Assert.NotNull(results[0].Snippet);
        Assert.Contains("authentication", results[0].Snippet);
        Assert.Single(results[0].Breadcrumbs);
        Assert.Equal("Project Roadmap", results[0].Breadcrumbs[0]);
    }

    [Fact]
    public async Task FavoritesAndTrash_ShouldFilterCorrectly()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, workspaceId, parent, child, archived) = await SetupWorkspaceWithPagesAsync(db);
        var pageService = new PageService(db);

        // Act
        var favorites = (await pageService.GetFavoritePagesAsync(userId, workspaceId)).ToList();
        var trash = (await pageService.GetTrashPagesAsync(userId, workspaceId)).ToList();

        // Assert
        Assert.Single(favorites);
        Assert.Equal(parent.Id, favorites[0].Id);

        Assert.Single(trash);
        Assert.Equal(archived.Id, trash[0].Id);
    }

    [Fact]
    public async Task EmptyTrashAsync_ShouldDeleteArchivedPages()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, workspaceId, _, _, _) = await SetupWorkspaceWithPagesAsync(db);
        var pageService = new PageService(db);

        // Act
        await pageService.EmptyTrashAsync(userId, workspaceId);

        // Assert
        var trashAfter = (await pageService.GetTrashPagesAsync(userId, workspaceId)).ToList();
        Assert.Empty(trashAfter);
    }
}
