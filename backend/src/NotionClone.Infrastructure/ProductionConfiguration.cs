using Microsoft.Extensions.Configuration;
using Npgsql;

namespace NotionClone.Infrastructure;

public static class ProductionConfiguration
{
    public static void Validate(IConfiguration configuration)
    {
        var secret = configuration["Jwt:Secret"];
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32 || IsPlaceholder(secret))
            throw new InvalidOperationException("Production requires a strong, non-placeholder JWT signing secret.");
        var connection = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connection))
            throw new InvalidOperationException("Production requires a database connection string.");
        NpgsqlConnectionStringBuilder parsed;
        try { parsed = new NpgsqlConnectionStringBuilder(connection); }
        catch { throw new InvalidOperationException("Production database connection string is invalid."); }
        if (string.IsNullOrWhiteSpace(parsed.Password) || IsPlaceholder(parsed.Password) || parsed.Password == "postgres")
            throw new InvalidOperationException("Production requires a non-placeholder database password.");
        if (configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() is not { Length: > 0 })
            throw new InvalidOperationException("Production requires explicit frontend CORS origins.");
    }

    private static bool IsPlaceholder(string value) =>
        new[] { "CHANGE_ME", "change-me", "replace_me", "your_secret", "default_password" }
            .Any(marker => value.Contains(marker, StringComparison.OrdinalIgnoreCase));
}
