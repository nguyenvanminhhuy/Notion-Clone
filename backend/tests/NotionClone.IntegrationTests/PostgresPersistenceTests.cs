using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Npgsql;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Auth;
using NotionClone.Application.DTOs.Page;
using NotionClone.Application.DTOs.Workspace;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Infrastructure.Authentication;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;

namespace NotionClone.IntegrationTests;

public sealed class PostgreSqlFactAttribute : FactAttribute
{
    public PostgreSqlFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("NOTION_TEST_POSTGRES")))
            Skip = "Set NOTION_TEST_POSTGRES to an isolated PostgreSQL test server connection.";
    }
}

public class PostgresPersistenceTests
{
    [PostgreSqlFact]
    public async Task MigrationsJsonbForeignKeysAndConcurrentRefresh_WorkOnPostgres()
    {
        var adminString = Environment.GetEnvironmentVariable("NOTION_TEST_POSTGRES")!;
        var databaseName = $"notion_test_{Guid.NewGuid():N}";
        await using var admin = new NpgsqlConnection(adminString);
        await admin.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", admin))
            await create.ExecuteNonQueryAsync();
        var connection = new NpgsqlConnectionStringBuilder(adminString) { Database = databaseName, Pooling = false }.ConnectionString;
        var options = new DbContextOptionsBuilder<NotionDbContext>().UseNpgsql(connection).Options;
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        { ["Jwt:Secret"] = "PostgresTestSigningSecretAtLeast32Characters" }).Build();
        var jwt = new JwtService(config);
        try
        {
            await using var db = new NotionDbContext(options);
            await db.GetService<IMigrator>().MigrateAsync("20260926052400_AddRefreshTokens");
            var auth = new AuthService(db, jwt, config);
            var legacy = await auth.RegisterAsync(new RegisterRequest("legacy@example.test", "Password123!", "Legacy"));
            var legacyRow = await db.RefreshTokens.SingleAsync();
            legacyRow.Token = legacy.RefreshToken;
            legacyRow.ReplacedByToken = "legacy-plaintext";
            await db.SaveChangesAsync();
            await db.Database.MigrateAsync();
            db.ChangeTracker.Clear();
            var invalidated = await db.RefreshTokens.SingleAsync();
            Assert.True(invalidated.IsRevoked);
            Assert.NotEqual(legacy.RefreshToken, invalidated.Token);
            Assert.Null(invalidated.ReplacedByToken);
            Assert.Empty(await db.Database.GetPendingMigrationsAsync());
            Assert.False(db.Database.HasPendingModelChanges());

            var session = await auth.RegisterAsync(new RegisterRequest("current@example.test", "Password123!", "Current"));
            var workspace = await new WorkspaceService(db).CreateWorkspaceAsync(session.User.Id, new CreateWorkspaceRequest("PG", null, null));
            var page = await new PageService(db).CreatePageAsync(session.User.Id, workspace.Id, new CreatePageRequest(null, "JSON", null, null, "{\"type\":\"doc\"}"));
            await using (var sql = new NpgsqlConnection(connection))
            {
                await sql.OpenAsync();
                await using var query = new NpgsqlCommand("SELECT pg_typeof(\"Content\")::text FROM \"Pages\" WHERE \"Id\" = @id", sql);
                query.Parameters.AddWithValue("id", page.Id);
                Assert.Equal("jsonb", await query.ExecuteScalarAsync());
            }
            var badPage = new Page { WorkspaceId = Guid.NewGuid(), Title = "Invalid FK", Content = "{}", CreatedById = session.User.Id, LastEditedById = session.User.Id };
            db.Pages.Add(badPage);
            await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
            db.Entry(badPage).State = EntityState.Detached;

            using var barrier = new Barrier(2);
            var synchronizedJwt = new SynchronizedJwt(jwt, barrier);
            async Task<bool> Refresh()
            {
                await using var context = new NotionDbContext(options);
                try { await new AuthService(context, synchronizedJwt, config).RefreshTokenAsync(session.RefreshToken); return true; }
                catch (UnauthorizedException) { return false; }
            }
            var outcomes = await Task.WhenAll(Task.Run(Refresh), Task.Run(Refresh));
            Assert.Single(outcomes.Where(result => result));
            db.ChangeTracker.Clear();
            Assert.Equal(1, await db.RefreshTokens.CountAsync(t => t.UserId == session.User.Id && !t.IsRevoked));
        }
        finally
        {
            // Only the UUID-named database created by this test is removed.
            await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", admin);
            await drop.ExecuteNonQueryAsync();
        }
    }

    private sealed class SynchronizedJwt(IJwtService inner, Barrier barrier) : IJwtService
    {
        public string GenerateAccessToken(User user) => inner.GenerateAccessToken(user);
        public Guid? ValidateAccessToken(string token) => inner.ValidateAccessToken(token);
        public string GenerateRefreshToken()
        {
            if (!barrier.SignalAndWait(TimeSpan.FromSeconds(10))) throw new TimeoutException("Refresh synchronization failed.");
            return inner.GenerateRefreshToken();
        }
    }
}
