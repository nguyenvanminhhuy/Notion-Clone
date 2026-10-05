using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Auth;
using NotionClone.Application.DTOs.Comment;
using NotionClone.Application.DTOs.Page;
using NotionClone.Application.DTOs.Share;
using NotionClone.Application.DTOs.Workspace;
using NotionClone.Domain.Enums;
using NotionClone.Infrastructure;
using NotionClone.Infrastructure.Authentication;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;

namespace NotionClone.UnitTests;

public class Phase14BHardeningTests
{
    private static NotionDbContext Db() => new(new DbContextOptionsBuilder<NotionDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static IConfiguration Config() => new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
    {
        ["Jwt:Secret"] = "TestOnlySigningKeyWithEnoughCharacters_12345",
        ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=test;Username=test;Password=test-only-password",
        ["Cors:AllowedOrigins:0"] = "https://example.test"
    }).Build();

    [Fact]
    public async Task RefreshTokens_AreHashedRotatedAndRevoked()
    {
        await using var db = Db();
        var config = Config();
        var auth = new AuthService(db, new JwtService(config), config);
        var first = await auth.RegisterAsync(new RegisterRequest("hash@example.test", "Password123!", "Hash User"));
        var stored = await db.RefreshTokens.SingleAsync();
        Assert.NotEqual(first.RefreshToken, stored.Token);
        Assert.Equal(64, stored.Token.Length);
        var second = await auth.RefreshTokenAsync(first.RefreshToken);
        Assert.True(stored.IsRevoked);
        Assert.NotEqual(second.RefreshToken, stored.ReplacedByToken);
        Assert.Equal(64, stored.ReplacedByToken!.Length);
        await Assert.ThrowsAsync<UnauthorizedException>(() => auth.RefreshTokenAsync(first.RefreshToken));
        await auth.LogoutAsync(second.RefreshToken);
        await Assert.ThrowsAsync<UnauthorizedException>(() => auth.RefreshTokenAsync(second.RefreshToken));
        await Assert.ThrowsAsync<UnauthorizedException>(() => auth.RefreshTokenAsync(new string('x', 513)));
    }

    [Fact]
    public async Task BusinessEvents_CreateIsolatedNotificationsWithoutSelfNoise()
    {
        await using var db = Db();
        var config = Config();
        var auth = new AuthService(db, new JwtService(config), config);
        var owner = (await auth.RegisterAsync(new RegisterRequest("owner@example.test", "Password123!", "Owner"))).User.Id;
        var other = (await auth.RegisterAsync(new RegisterRequest("other@example.test", "Password123!", "Other"))).User.Id;
        var workspaceService = new WorkspaceService(db);
        var workspace = await workspaceService.CreateWorkspaceAsync(owner, new CreateWorkspaceRequest("Tests", null, null));
        await workspaceService.AddMemberAsync(owner, workspace.Id, new InviteMemberRequest("other@example.test", UserRole.Member));
        var page = await new PageService(db).CreatePageAsync(owner, workspace.Id, new CreatePageRequest(null, "Page", null, null, null));
        await new ShareService(db).SharePageAsync(owner, page.Id, new CreateShareRequest("other@example.test", PageRole.Editor));
        var comments = new CommentService(db);
        var comment = await comments.CreateCommentAsync(other, page.Id, new CreateCommentRequest("Comment", null));
        await comments.ReplyToCommentAsync(owner, comment.Id, new ReplyCommentRequest("Reply"));
        await comments.CreateCommentAsync(owner, page.Id, new CreateCommentRequest("Self", null));
        var notifications = new NotificationService(db);
        Assert.Equal(1, await notifications.GetUnreadCountAsync(owner));
        Assert.Equal(3, await notifications.GetUnreadCountAsync(other));
        var owners = (await notifications.GetUserNotificationsAsync(owner)).ToList();
        await Assert.ThrowsAsync<NotFoundException>(() => notifications.MarkAsReadAsync(other, owners[0].Id));
        await notifications.MarkAsReadAsync(owner, owners[0].Id);
        await notifications.MarkAllAsReadAsync(other);
        Assert.Equal(0, await notifications.GetUnreadCountAsync(owner));
        Assert.Equal(0, await notifications.GetUnreadCountAsync(other));
    }

    [Fact]
    public void ProductionConfiguration_RejectsPlaceholdersWithoutLeakingValues()
    {
        var config = Config();
        ProductionConfiguration.Validate(config);
        config["Jwt:Secret"] = "CHANGE_ME_TO_A_STRONG_SECRET_KEY_AT_LEAST_32_CHARS";
        var exception = Assert.Throws<InvalidOperationException>(() => ProductionConfiguration.Validate(config));
        Assert.DoesNotContain(config["Jwt:Secret"]!, exception.Message);
        config["Jwt:Secret"] = "TestOnlySigningKeyWithEnoughCharacters_12345";
        config["ConnectionStrings:DefaultConnection"] = "Host=localhost;Password=postgres";
        Assert.Throws<InvalidOperationException>(() => ProductionConfiguration.Validate(config));
    }
}
