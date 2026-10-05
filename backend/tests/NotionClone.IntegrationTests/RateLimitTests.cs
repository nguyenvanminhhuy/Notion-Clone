using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace NotionClone.IntegrationTests;

public class RateLimitTests
{
    [Fact]
    public async Task AuthLimiter_Returns429AfterConfiguredLimit()
    {
        using var factory = new NotionCloneWebApplicationFactory(1);
        using var client = factory.CreateClient();
        var first = await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = "invalid" });
        var second = await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = "invalid" });
        Assert.Equal(HttpStatusCode.Unauthorized, first.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, second.StatusCode);
    }

    [Fact]
    public async Task AiLimiter_IsIsolatedByAuthenticatedUser()
    {
        using var factory = new NotionCloneWebApplicationFactory();
        using var first = factory.CreateClient();
        using var second = factory.CreateClient();
        foreach (var client in new[] { first, second })
        {
            var register = await client.PostAsJsonAsync("/api/auth/register", new
            { email = $"{Guid.NewGuid():N}@example.test", password = "Password123!", name = "Limit User" });
            var body = await register.Content.ReadFromJsonAsync<JsonElement>();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body.GetProperty("accessToken").GetString());
        }
        for (var i = 0; i < 30; i++)
            Assert.Equal(HttpStatusCode.OK, (await first.PostAsJsonAsync("/api/ai/generate", new { prompt = "test" })).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await first.PostAsJsonAsync("/api/ai/generate", new { prompt = "test" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await second.PostAsJsonAsync("/api/ai/generate", new { prompt = "test" })).StatusCode);
    }
}
