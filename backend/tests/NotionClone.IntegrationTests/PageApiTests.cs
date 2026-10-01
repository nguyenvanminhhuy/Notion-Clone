using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace NotionClone.IntegrationTests;

/// <summary>
/// Integration tests for the Page hierarchy, CRUD, and authorization endpoints.
/// Each test creates its own isolated HttpClient to prevent header bleed-over.
/// </summary>
public class PageApiTests : IClassFixture<NotionCloneWebApplicationFactory>
{
    private readonly NotionCloneWebApplicationFactory _factory;

    public PageApiTests(NotionCloneWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>Registers a user, creates a workspace, and returns an authenticated client + workspace ID.</summary>
    private async Task<(HttpClient Client, Guid WorkspaceId)> SetupAsync(string suffix = "")
    {
        var client = _factory.CreateClient();
        var email = $"page_{suffix}_{Guid.NewGuid():N}@example.com";
        var regResp = await client.PostAsJsonAsync("/api/auth/register",
            new { email, password = "SecurePass123!", name = "Page User" });
        var tokens = await regResp.Content.ReadFromJsonAsync<TokenResponse>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", tokens!.AccessToken);

        var wsResp = await client.PostAsJsonAsync("/api/workspaces",
            new { name = $"WS_{suffix}", iconEmoji = (string?)null, iconUrl = (string?)null });
        Assert.Equal(HttpStatusCode.Created, wsResp.StatusCode);

        var ws = await wsResp.Content.ReadFromJsonAsync<WorkspaceDto>();
        return (client, ws!.Id);
    }

    private async Task<HttpClient> AuthClientAsync(string suffix = "")
    {
        var client = _factory.CreateClient();
        var email = $"page_{suffix}_{Guid.NewGuid():N}@example.com";
        var regResp = await client.PostAsJsonAsync("/api/auth/register",
            new { email, password = "SecurePass123!", name = "User" });
        var tokens = await regResp.Content.ReadFromJsonAsync<TokenResponse>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", tokens!.AccessToken);
        return client;
    }

    // ─── Create Page ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CreatePage_ValidRequest_Returns201()
    {
        var (client, wsId) = await SetupAsync("create");

        var response = await client.PostAsJsonAsync($"/api/workspaces/{wsId}/pages",
            new { title = "My First Page", parentId = (Guid?)null });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PageDto>();
        Assert.NotNull(body);
        Assert.Equal("My First Page", body!.Title);
    }

    [Fact]
    public async Task CreatePage_WithoutAuth_Returns401()
    {
        // Plain client with no auth header set
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync($"/api/workspaces/{Guid.NewGuid()}/pages",
            new { title = "Page" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreatePage_InNonexistentWorkspace_Returns403Or404()
    {
        var client = await AuthClientAsync("no_ws");
        var response = await client.PostAsJsonAsync($"/api/workspaces/{Guid.NewGuid()}/pages",
            new { title = "Orphan Page" });
        Assert.True(
            response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {response.StatusCode}");
    }

    // ─── Get Page ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPage_ByValidId_Returns200()
    {
        var (client, wsId) = await SetupAsync("get");
        var createResp = await client.PostAsJsonAsync($"/api/workspaces/{wsId}/pages",
            new { title = "Fetchable Page" });
        var created = await createResp.Content.ReadFromJsonAsync<PageDto>();

        var response = await client.GetAsync($"/api/pages/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetPage_NonexistentId_Returns404()
    {
        var client = await AuthClientAsync("notfound");
        var response = await client.GetAsync($"/api/pages/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ─── Update Page ──────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdatePage_AsOwner_Returns200()
    {
        var (client, wsId) = await SetupAsync("update");
        var createResp = await client.PostAsJsonAsync($"/api/workspaces/{wsId}/pages",
            new { title = "Original Title" });
        var created = await createResp.Content.ReadFromJsonAsync<PageDto>();

        var patchResp = await client.PatchAsJsonAsync($"/api/pages/{created!.Id}",
            new { title = "Updated Title" });

        Assert.Equal(HttpStatusCode.OK, patchResp.StatusCode);
        var updated = await patchResp.Content.ReadFromJsonAsync<PageDto>();
        Assert.Equal("Updated Title", updated!.Title);
    }

    // ─── Delete Page (Soft) ───────────────────────────────────────────────────

    [Fact]
    public async Task DeletePage_SoftDelete_Returns204()
    {
        var (client, wsId) = await SetupAsync("delete");
        var createResp = await client.PostAsJsonAsync($"/api/workspaces/{wsId}/pages",
            new { title = "To Delete" });
        var created = await createResp.Content.ReadFromJsonAsync<PageDto>();

        var deleteResp = await client.DeleteAsync($"/api/pages/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);
    }

    [Fact]
    public async Task DeletedPage_IsNoLongerAccessible()
    {
        var (client, wsId) = await SetupAsync("gone");
        var createResp = await client.PostAsJsonAsync($"/api/workspaces/{wsId}/pages",
            new { title = "Gone Page" });
        var created = await createResp.Content.ReadFromJsonAsync<PageDto>();

        await client.DeleteAsync($"/api/pages/{created!.Id}");

        var getResp = await client.GetAsync($"/api/pages/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);
    }

    // ─── Page Tree ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPageTree_Returns200WithPages()
    {
        var (client, wsId) = await SetupAsync("tree");
        await client.PostAsJsonAsync($"/api/workspaces/{wsId}/pages",
            new { title = "Root Page" });

        var response = await client.GetAsync($"/api/workspaces/{wsId}/pages/tree");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ─── Child Pages ──────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateChildPage_ValidParent_Returns201()
    {
        var (client, wsId) = await SetupAsync("child");
        var parentResp = await client.PostAsJsonAsync($"/api/workspaces/{wsId}/pages",
            new { title = "Parent Page" });
        var parent = await parentResp.Content.ReadFromJsonAsync<PageDto>();

        var childResp = await client.PostAsJsonAsync($"/api/workspaces/{wsId}/pages",
            new { title = "Child Page", parentId = parent!.Id });

        Assert.Equal(HttpStatusCode.Created, childResp.StatusCode);
        var child = await childResp.Content.ReadFromJsonAsync<PageDto>();
        Assert.Equal(parent.Id, child!.ParentId);
    }

    // ─── Authorization ────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdatePage_ByNonMember_Returns403Or404()
    {
        var (clientOwner, wsId) = await SetupAsync("auth_owner");
        var createResp = await clientOwner.PostAsJsonAsync($"/api/workspaces/{wsId}/pages",
            new { title = "Protected" });
        var created = await createResp.Content.ReadFromJsonAsync<PageDto>();

        // Different user — no access to this workspace
        var clientOther = await AuthClientAsync("auth_other");
        var patchResp = await clientOther.PatchAsJsonAsync($"/api/pages/{created!.Id}",
            new { title = "Hacked Title" });

        Assert.True(
            patchResp.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.NotFound,
            $"Expected 403 or 404 but got {patchResp.StatusCode}");
    }

    // ─── Records ──────────────────────────────────────────────────────────────

    private record TokenResponse(string AccessToken, string RefreshToken, object User);
    private record WorkspaceDto(Guid Id, string Name, string Slug, string? IconEmoji, string? IconUrl, int Plan, DateTime CreatedAt, DateTime UpdatedAt);
    private record PageDto(Guid Id, Guid WorkspaceId, Guid? ParentId, string Title, string? Icon, string? Cover, string Content, bool IsFavorite, bool IsArchived, bool IsPublic, Guid CreatedById, Guid LastEditedById, DateTime CreatedAt, DateTime UpdatedAt, DateTime? LastOpenedAt);
}
