using Microsoft.EntityFrameworkCore;
using NotionClone.Application.DTOs.Comment;
using NotionClone.Application.DTOs.Share;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;
using Xunit;

namespace NotionClone.UnitTests;

public class CommentsAndSharingTests
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

        var user = new User { Id = userId, Email = "user@example.com", Name = "Collab User" };
        var workspace = new Workspace { Id = workspaceId, Name = "Collab Workspace", Slug = "collab-workspace" };
        var member = new WorkspaceMember { Id = Guid.NewGuid(), WorkspaceId = workspaceId, UserId = userId, Role = UserRole.Owner };
        var page = new Page
        {
            Id = pageId,
            WorkspaceId = workspaceId,
            Title = "Collaboration Doc",
            Content = "{}",
            IsPublic = false,
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
    public async Task CreateCommentAndReply_ShouldBuildNestedHierarchy()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var commentService = new CommentService(db);

        // Act
        var comment = await commentService.CreateCommentAsync(userId, pageId, new CreateCommentRequest("Top level comment", null));
        var reply = await commentService.ReplyToCommentAsync(userId, comment.Id, new ReplyCommentRequest("Reply to comment"));

        var comments = (await commentService.GetPageCommentsAsync(userId, pageId)).ToList();

        // Assert
        Assert.Single(comments);
        Assert.Equal("Top level comment", comments[0].Content);
        Assert.Single(comments[0].Replies);
        Assert.Equal("Reply to comment", comments[0].Replies[0].Content);
    }

    [Fact]
    public async Task ResolveComment_ShouldToggleResolvedStatus()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var commentService = new CommentService(db);

        var comment = await commentService.CreateCommentAsync(userId, pageId, new CreateCommentRequest("Needs review", null));
        Assert.False(comment.Resolved);

        // Act
        var resolved = await commentService.ResolveCommentAsync(userId, comment.Id);

        // Assert
        Assert.True(resolved.Resolved);
    }

    [Fact]
    public async Task SharePageAndPublicAccess_ShouldWorkCorrectly()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var (userId, _, pageId) = await SetupPageAsync(db);
        var shareService = new ShareService(db);

        // Act 1: Share with external email
        var share = await shareService.SharePageAsync(userId, pageId, new CreateShareRequest("partner@example.com", PageRole.Editor));
        Assert.Equal("partner@example.com", share.Email);
        Assert.Equal(PageRole.Editor, share.Role);

        // Act 2: Toggle public access
        var publicPage = await shareService.TogglePublicAccessAsync(userId, pageId, new TogglePublicAccessRequest(true));
        Assert.True(publicPage.IsPublic);

        // Act 3: Public get
        var retrievedPublic = await shareService.GetPublicPageAsync(pageId);
        Assert.Equal("Collaboration Doc", retrievedPublic.Title);
    }
}
