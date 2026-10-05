using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.IntegrationTests;

/// <summary>
/// A test host that replaces the PostgreSQL database with an in-memory EF Core database
/// and overrides secrets so tests don't need a real configuration file.
/// </summary>
public class NotionCloneWebApplicationFactory : WebApplicationFactory<Program>
{
    // Each factory instance gets its own unique DB name so test classes don't share state
    private readonly string _dbName = $"NotionCloneTestDb_{Guid.NewGuid():N}";
    private readonly int _authLimit;
    public NotionCloneWebApplicationFactory() : this(1000) { }
    internal NotionCloneWebApplicationFactory(int authLimit) { _authLimit = authLimit; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddConsole();
        });

        // ConfigureAppConfiguration runs BEFORE AddInfrastructure, so Jwt:Secret is found
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "IntegrationTestSecretKey_AtLeast32CharsLongEnough!!",
                ["RateLimits:AuthPermits"] = _authLimit.ToString(),
                ["Jwt:Issuer"] = "NotionClone",
                ["Jwt:Audience"] = "NotionCloneUsers",
                ["Jwt:AccessTokenExpiryMinutes"] = "60",
                ["Jwt:RefreshTokenExpiryDays"] = "7",
                ["Cors:AllowedOrigins:0"] = "http://localhost:3000",
                ["FileStorage:BasePath"] = Path.GetTempPath()
            });
        });

        // ConfigureServices runs AFTER AddInfrastructure (from Program.cs)
        // so we can remove the Npgsql DbContext and add InMemory
        builder.ConfigureServices(services =>
        {
            // Ensure JWT bearer validation uses the test secret
            services.PostConfigure<Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerOptions>(
                Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme,
                options =>
                {
                    var secret = "IntegrationTestSecretKey_AtLeast32CharsLongEnough!!";
                    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secret)),
                        ValidateIssuer = true,
                        ValidIssuer = "NotionClone",
                        ValidateAudience = true,
                        ValidAudience = "NotionCloneUsers",
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero
                    };
                });

            // Remove all DbContext-related registrations added by AddInfrastructure
            var descriptorsToRemove = services
                .Where(d =>
                    d.ServiceType == typeof(DbContextOptions<NotionDbContext>) ||
                    d.ServiceType == typeof(DbContextOptions) ||
                    d.ServiceType == typeof(NotionDbContext))
                .ToList();
            foreach (var d in descriptorsToRemove)
                services.Remove(d);

            // Register InMemory database instead
            services.AddDbContext<NotionDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });
    }
}
