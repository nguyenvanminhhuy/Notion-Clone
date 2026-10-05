using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Migrations;

[DbContext(typeof(NotionDbContext))]
[Migration("20261005060000_HashRefreshTokenStorage")]
public sealed class HashRefreshTokenStorage : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Legacy sessions are revoked and their plaintext values removed. Users must sign in again.
        migrationBuilder.Sql("UPDATE \"RefreshTokens\" SET \"Token\" = 'invalidated-' || \"Id\"::text, \"ReplacedByToken\" = NULL, \"IsRevoked\" = TRUE;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // One-way credential invalidation: raw tokens cannot and must not be reconstructed.
    }
}
