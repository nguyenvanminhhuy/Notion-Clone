using Microsoft.EntityFrameworkCore;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.AI;
using NotionClone.Application.DTOs.Page;
using NotionClone.Application.DTOs.Share;
using NotionClone.Domain.Entities;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure.AI;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;

namespace NotionClone.UnitTests;

public class Phase14ASecurityTests
{
    private static NotionDbContext CreateDb() => new(
        new DbContextOptionsBuilder<NotionDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static async Task<(Guid ownerId, Guid adminId, Guid memberId, Guid guestId, Guid viewerId, Guid editorId, Guid unrelatedId, Guid workspaceId, Guid pageId)> SetupAsync(NotionDbContext db)
    {
        var owner = NewUser("owner");
        var admin = NewUser("admin");
        var member = NewUser("member");
        var guest = NewUser("guest");
        var viewer = NewUser("viewer");
        var editor = NewUser("editor");
        var unrelated = NewUser("unrelated");
        var workspace = new Workspace { Id = Guid.NewGuid(), Name = "Security", Slug = Guid.NewGuid().ToString("N") };
        var page = new Page
        {
            Id = Guid.NewGuid(), WorkspaceId = workspace.Id, Title = "Secured", Content = "{\"type\":\"doc\"}",
            CreatedById = owner.Id, LastEditedById = owner.Id
        };

        db.AddRange(owner, admin, member, guest, viewer, editor, unrelated, workspace, page);
        db.WorkspaceMembers.AddRange(
            new WorkspaceMember { Id = Guid.NewGuid(), WorkspaceId = workspace.Id, UserId = owner.Id, Role = UserRole.Owner },
            new WorkspaceMember { Id = Guid.NewGuid(), WorkspaceId = workspace.Id, UserId = admin.Id, Role = UserRole.Admin },
            new WorkspaceMember { Id = Guid.NewGuid(), WorkspaceId = workspace.Id, UserId = member.Id, Role = UserRole.Member },
            new WorkspaceMember { Id = Guid.NewGuid(), WorkspaceId = workspace.Id, UserId = guest.Id, Role = UserRole.Guest });
        db.PageShares.AddRange(
            new PageShare { Id = Guid.NewGuid(), PageId = page.Id, UserId = viewer.Id, Role = PageRole.Viewer },
            new PageShare { Id = Guid.NewGuid(), PageId = page.Id, UserId = editor.Id, Role = PageRole.Editor });
        await db.SaveChangesAsync();
        return (owner.Id, admin.Id, member.Id, guest.Id, viewer.Id, editor.Id, unrelated.Id, workspace.Id, page.Id);
    }

    [Fact]
    public async Task AuthorizationMatrix_EnforcesWorkspaceAndShareRoles()
    {
        await using var db = CreateDb();
        var users = await SetupAsync(db);
        var pages = new PageService(db);
        var shares = new ShareService(db);

        await shares.TogglePublicAccessAsync(users.adminId, users.pageId, new TogglePublicAccessRequest(true));
        await shares.TogglePublicAccessAsync(users.ownerId, users.pageId, new TogglePublicAccessRequest(false));
        await pages.UpdatePageContentAsync(users.memberId, users.pageId, new UpdatePageContentRequest("{\"type\":\"doc\",\"content\":[]}"));
        await Assert.ThrowsAsync<ForbiddenException>(() => pages.PermanentDeletePageAsync(users.memberId, users.pageId));
        await Assert.ThrowsAsync<ForbiddenException>(() => shares.TogglePublicAccessAsync(users.memberId, users.pageId, new TogglePublicAccessRequest(true)));
        await Assert.ThrowsAsync<ForbiddenException>(() => pages.UpdatePageContentAsync(users.guestId, users.pageId, new UpdatePageContentRequest("{\"type\":\"doc\"}")));
        await pages.GetPageByIdAsync(users.viewerId, users.pageId);
        await Assert.ThrowsAsync<ForbiddenException>(() => pages.UpdatePageContentAsync(users.viewerId, users.pageId, new UpdatePageContentRequest("{\"type\":\"doc\"}")));
        await pages.UpdatePageContentAsync(users.editorId, users.pageId, new UpdatePageContentRequest("{\"type\":\"doc\",\"content\":[]}"));
        await Assert.ThrowsAsync<ForbiddenException>(() => shares.SharePageAsync(users.editorId, users.pageId, new CreateShareRequest("new@example.com", PageRole.Viewer)));
        await Assert.ThrowsAsync<ForbiddenException>(() => pages.GetPageByIdAsync(users.unrelatedId, users.pageId));
    }

    [Fact]
    public async Task ContentValidation_RejectsInvalidAndOversizedJson()
    {
        await using var db = CreateDb();
        var users = await SetupAsync(db);
        var pages = new PageService(db);

        await Assert.ThrowsAsync<ValidationException>(() =>
            pages.UpdatePageContentAsync(users.ownerId, users.pageId, new UpdatePageContentRequest("not-json")));
        var oversized = "{\"value\":\"" + new string('a', 1024 * 1024) + "\"}";
        await Assert.ThrowsAsync<ValidationException>(() =>
            pages.UpdatePageContentAsync(users.ownerId, users.pageId, new UpdatePageContentRequest(oversized)));
    }

    [Fact]
    public async Task RestorePage_RestoresEntireSubtree()
    {
        await using var db = CreateDb();
        var users = await SetupAsync(db);
        var pages = new PageService(db);
        var child = await pages.CreatePageAsync(users.ownerId, users.workspaceId, new CreatePageRequest(users.pageId, "Child", null, null, null));
        var grandchild = await pages.CreatePageAsync(users.ownerId, users.workspaceId, new CreatePageRequest(child.Id, "Grandchild", null, null, null));

        await pages.SoftDeletePageAsync(users.ownerId, users.pageId);
        await pages.RestorePageAsync(users.ownerId, users.pageId);

        Assert.All(await db.Pages.Where(p => p.Id == users.pageId || p.Id == child.Id || p.Id == grandchild.Id).ToListAsync(), p => Assert.False(p.IsArchived));
    }

    [Fact]
    public async Task AiPageContext_RequiresPageReadPermission()
    {
        await using var db = CreateDb();
        var users = await SetupAsync(db);
        var engine = new CapturingAiEngine();
        var ai = new AiService(db, engine);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            ai.GenerateAsync(users.unrelatedId, new AiGenerateRequest("Summarize", "forged context", "summarize", users.pageId)));
        var allowed = await ai.GenerateAsync(users.viewerId, new AiGenerateRequest("Summarize", "forged context", "summarize", users.pageId));
        Assert.StartsWith("[Demo AI]", allowed.Response);
        Assert.Equal("{\"type\":\"doc\"}", engine.Context);
    }

    [Fact]
    public async Task AiLimitsAndFailures_AreEnforced()
    {
        await using var db = CreateDb();
        var users = await SetupAsync(db);
        var ai = new AiService(db, new CapturingAiEngine(new string('x', 9_000)));

        await Assert.ThrowsAsync<ValidationException>(() =>
            ai.GenerateAsync(users.ownerId, new AiGenerateRequest(new string('p', 4_001), null, "custom", null)));
        await Assert.ThrowsAsync<NotFoundException>(() =>
            ai.GenerateAsync(users.ownerId, new AiGenerateRequest("test", null, "custom", Guid.NewGuid())));
        var limited = await ai.GenerateAsync(users.ownerId, new AiGenerateRequest("test", null, "custom", null));
        Assert.Equal(8_000, limited.Response.Length);

        var failing = new AiService(db, new ThrowingAiEngine());
        await Assert.ThrowsAsync<ExternalServiceException>(() =>
            failing.GenerateAsync(users.ownerId, new AiGenerateRequest("test", null, "custom", null)));
    }

    private static User NewUser(string prefix) => new()
    {
        Id = Guid.NewGuid(),
        Email = $"{prefix}-{Guid.NewGuid():N}@example.com",
        Name = prefix
    };

    private sealed class CapturingAiEngine(string? response = null) : NotionClone.Application.Interfaces.IAiEngine
    {
        public string? Context { get; private set; }

        public Task<string> GenerateAsync(string prompt, string? contextText, string actionType, CancellationToken ct = default)
        {
            Context = contextText;
            return Task.FromResult(response ?? $"[Demo AI] {prompt}");
        }
    }

    private sealed class ThrowingAiEngine : NotionClone.Application.Interfaces.IAiEngine
    {
        public Task<string> GenerateAsync(string prompt, string? contextText, string actionType, CancellationToken ct = default) =>
            throw new InvalidOperationException("provider unavailable");
    }
}
