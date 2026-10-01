using System.Net;

namespace NotionClone.IntegrationTests;

/// <summary>
/// Integration tests verifying that security headers are present in API responses.
/// </summary>
public class SecurityHeaderTests : IClassFixture<NotionCloneWebApplicationFactory>
{
    private readonly NotionCloneWebApplicationFactory _factory;

    public SecurityHeaderTests(NotionCloneWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ApiResponse_ContainsXContentTypeOptionsHeader()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");
        Assert.True(
            response.Headers.TryGetValues("X-Content-Type-Options", out var values),
            "Expected X-Content-Type-Options header.");
        Assert.Contains("nosniff", values);
    }

    [Fact]
    public async Task ApiResponse_ContainsXFrameOptionsHeader()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");
        Assert.True(
            response.Headers.TryGetValues("X-Frame-Options", out var values),
            "Expected X-Frame-Options header.");
        Assert.Contains("DENY", values);
    }

    [Fact]
    public async Task ApiResponse_ContainsXXssProtectionHeader()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");
        Assert.True(
            response.Headers.TryGetValues("X-XSS-Protection", out var values),
            "Expected X-XSS-Protection header.");
        Assert.Contains("1; mode=block", values);
    }

    [Fact]
    public async Task ApiResponse_ContainsReferrerPolicyHeader()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/auth/me");
        Assert.True(
            response.Headers.TryGetValues("Referrer-Policy", out var values),
            "Expected Referrer-Policy header.");
        Assert.Contains("strict-origin-when-cross-origin", values);
    }
}
