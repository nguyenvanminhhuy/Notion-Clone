using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace NotionClone.IntegrationTests;

/// <summary>
/// Integration tests for Workspace CRUD and member management endpoints.
/// Each test creates its own HttpClient to avoid header bleed-over.
/// </summary>
public class WorkspaceApiTests : IClassFixture<NotionCloneWebApplicationFactory>
{
    private readonly NotionCloneWebApplicationFactory _factory;

    public WorkspaceApiTests(NotionCloneWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task<(HttpClient Client, Guid WorkspaceId)> SetupAsync(string suffix = "")
    {
        var client = _factory.CreateClient();
        var email = $"ws_{suffix}_{Guid.NewGuid():N}@example.com";
        var regResp = await client.PostAsJsonAsync("/api/auth/register",
            new { email, password = "SecurePass123!", name = "WS User" });
        var tokens = await regResp.Content.ReadFromJsonAsync<TokenResponse>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", tokens!.AccessToken);

        var wsResp = await client.PostAsJsonAsync("/api/workspaces",
            new { name = $"Workspace_{suffix}", iconEmoji = (string?)null, iconUrl = (string?)null });
        var ws = await wsResp.Content.ReadFromJsonAsync<WorkspaceDto>();

        return (client, ws!.Id);
    }

    private async Task<HttpClient> AuthClientAsync(string suffix = "")
    {
        var client = _factory.CreateClient();
        var email = $"ws_{suffix}_{Guid.NewGuid():N}@example.com";
        var regResp = await client.PostAsJsonAsync("/api/auth/register",
            new { email, password = "SecurePass123!", name = "WS User" });
        var tokens = await regResp.Content.ReadFromJsonAsync<TokenResponse>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", tokens!.AccessToken);
        return client;
    }

    // ─── Unauthenticated Access ───────────────────────────────────────────────

    [Fact]
    public async Task GetWorkspaces_WithoutAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/workspaces");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ─── Create Workspace ─────────────────────────────────────────────────────

    [Fact]
    public async Task CreateWorkspace_ValidRequest_Returns201()
    {
        var client = await AuthClientAsync("create");

        var response = await client.PostAsJsonAsync("/api/workspaces",
            new { name = "My Workspace", iconEmoji = (string?)null, iconUrl = (string?)null });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<WorkspaceDto>();
        Assert.NotNull(body);
        Assert.Equal("My Workspace", body!.Name);
    }

    [Fact]
    public async Task CreateWorkspace_MissingName_Returns422()
    {
        var client = await AuthClientAsync("missing_name");

        var response = await client.PostAsJsonAsync("/api/workspaces",
            new { name = "", iconEmoji = (string?)null, iconUrl = (string?)null });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    // ─── List Workspaces ──────────────────────────────────────────────────────

    [Fact]
    public async Task GetWorkspaces_AfterCreation_ReturnsWorkspace()
    {
        var client = await AuthClientAsync("list");

        await client.PostAsJsonAsync("/api/workspaces",
            new { name = "Listed Workspace", iconEmoji = (string?)null, iconUrl = (string?)null });

        var response = await client.GetAsync("/api/workspaces");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var list = await response.Content.ReadFromJsonAsync<WorkspaceDto[]>();
        Assert.NotNull(list);
        Assert.Contains(list!, w => w.Name == "Listed Workspace");
    }

    // ─── Get Single Workspace ─────────────────────────────────────────────────

    [Fact]
    public async Task GetWorkspace_ByValidId_Returns200()
    {
        var (client, wsId) = await SetupAsync("single");

        var response = await client.GetAsync($"/api/workspaces/{wsId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetWorkspace_ByNonexistentId_Returns403Or404()
    {
        var client = await AuthClientAsync("notfound");

        var response = await client.GetAsync($"/api/workspaces/{Guid.NewGuid()}");
        Assert.True(
            response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {response.StatusCode}");
    }

    [Fact]
    public async Task GetWorkspace_ByOtherUsersWorkspace_Returns403Or404()
    {
        // User A creates workspace
        var (clientA, wsId) = await SetupAsync("ownerA");

        // User B tries to access it (fresh client, different user)
        var clientB = await AuthClientAsync("otherB");
        var response = await clientB.GetAsync($"/api/workspaces/{wsId}");

        Assert.True(
            response.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.NotFound,
            $"Expected 403 or 404 but got {response.StatusCode}");
    }

    // ─── Update Workspace ─────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateWorkspace_AsOwner_Returns200()
    {
        var (client, wsId) = await SetupAsync("update");

        var patchResp = await client.PatchAsJsonAsync($"/api/workspaces/{wsId}",
            new { name = "New Name", iconEmoji = (string?)null, iconUrl = (string?)null });

        Assert.Equal(HttpStatusCode.OK, patchResp.StatusCode);
        var updated = await patchResp.Content.ReadFromJsonAsync<WorkspaceDto>();
        Assert.Equal("New Name", updated!.Name);
    }

    // ─── Delete Workspace ─────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteWorkspace_AsOwner_Returns204()
    {
        var (client, wsId) = await SetupAsync("delete");

        var deleteResp = await client.DeleteAsync($"/api/workspaces/{wsId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);
    }

    [Fact]
    public async Task DeleteWorkspace_AsNonMember_Returns403Or404()
    {
        var (clientA, wsId) = await SetupAsync("del_owner");

        var clientB = await AuthClientAsync("del_other");
        var deleteResp = await clientB.DeleteAsync($"/api/workspaces/{wsId}");

        Assert.True(
            deleteResp.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.NotFound,
            $"Expected 403 or 404 but got {deleteResp.StatusCode}");
    }

    // ─── Records ──────────────────────────────────────────────────────────────

    private record TokenResponse(string AccessToken, string RefreshToken, object User);
    private record WorkspaceDto(Guid Id, string Name, string Slug, string? IconEmoji, string? IconUrl, int Plan, DateTime CreatedAt, DateTime UpdatedAt);
}
