using System.Net;
using System.Net.Http.Json;

namespace NotionClone.IntegrationTests;

/// <summary>
/// Integration tests for the Authentication API endpoints.
/// Tests use an in-memory database so no external infrastructure is required.
/// </summary>
public class AuthApiTests : IClassFixture<NotionCloneWebApplicationFactory>
{
    private readonly NotionCloneWebApplicationFactory _factory;

    public AuthApiTests(NotionCloneWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // Create a fresh unauthenticated client for every test to avoid header bleed-over
    private HttpClient CreateClient() => _factory.CreateClient();

    // ─── Registration ────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_ValidRequest_Returns201WithTokens()
    {
        var client = CreateClient();
        var request = new
        {
            email = $"test_{Guid.NewGuid():N}@example.com",
            password = "SecurePass123!",
            name = "Test User"
        };

        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.NotNull(body);
        Assert.NotEmpty(body!.AccessToken);
        Assert.NotEmpty(body.RefreshToken);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409Conflict()
    {
        var client = CreateClient();
        var email = $"duplicate_{Guid.NewGuid():N}@example.com";
        var request = new { email, password = "SecurePass123!", name = "Test User" };

        await client.PostAsJsonAsync("/api/auth/register", request);
        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Register_MissingEmail_Returns422()
    {
        var client = CreateClient();
        var request = new { email = "", password = "SecurePass123!", name = "Test User" };

        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Register_ShortPassword_Returns422()
    {
        var client = CreateClient();
        var request = new
        {
            email = $"test_{Guid.NewGuid():N}@example.com",
            password = "short",
            name = "Test User"
        };

        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_ValidCredentials_Returns200WithTokens()
    {
        var client = CreateClient();
        var email = $"login_{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/auth/register",
            new { email, password = "SecurePass123!", name = "Login User" });

        var response = await client.PostAsJsonAsync("/api/auth/login",
            new { email, password = "SecurePass123!" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.NotNull(body);
        Assert.NotEmpty(body!.AccessToken);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var client = CreateClient();
        var email = $"badpass_{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/auth/register",
            new { email, password = "SecurePass123!", name = "User" });

        var response = await client.PostAsJsonAsync("/api/auth/login",
            new { email, password = "WrongPassword!" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_UnknownEmail_Returns401()
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login",
            new { email = "nobody@example.com", password = "SomePass123!" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ─── Current User ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetMe_WithValidToken_Returns200()
    {
        var client = CreateClient();
        var email = $"me_{Guid.NewGuid():N}@example.com";
        var registerResp = await client.PostAsJsonAsync("/api/auth/register",
            new { email, password = "SecurePass123!", name = "Me User" });

        var tokens = await registerResp.Content.ReadFromJsonAsync<TokenResponse>();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokens!.AccessToken);

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_WithoutToken_Returns401()
    {
        // Use a brand-new client with no auth header set
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ─── Refresh Token ────────────────────────────────────────────────────────

    [Fact]
    public async Task Refresh_ValidRefreshToken_Returns200WithNewTokens()
    {
        var client = CreateClient();
        var email = $"refresh_{Guid.NewGuid():N}@example.com";
        var registerResp = await client.PostAsJsonAsync("/api/auth/register",
            new { email, password = "SecurePass123!", name = "Refresh User" });

        var tokens = await registerResp.Content.ReadFromJsonAsync<TokenResponse>();

        var response = await client.PostAsJsonAsync("/api/auth/refresh",
            new { refreshToken = tokens!.RefreshToken });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var newTokens = await response.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.NotEmpty(newTokens!.AccessToken);
    }

    [Fact]
    public async Task Refresh_InvalidToken_Returns401()
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/refresh",
            new { refreshToken = "totally-invalid-token" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private record TokenResponse(string AccessToken, string RefreshToken, object User);
}
