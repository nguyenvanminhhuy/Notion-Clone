using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using NotionClone.Application.Interfaces;
using NotionClone.Infrastructure.Authentication;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;
using NotionClone.Infrastructure.Storage;
using NotionClone.Infrastructure.AI;

namespace NotionClone.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Database=notion_clone_db;Username=postgres;Password=postgres";

        services.AddDbContext<NotionDbContext>(options =>
            options.UseNpgsql(connectionString));

        // JWT Authentication
        var jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                    ValidateIssuer = true,
                    ValidIssuer = configuration["Jwt:Issuer"] ?? "NotionClone",
                    ValidateAudience = true,
                    ValidAudience = configuration["Jwt:Audience"] ?? "NotionCloneUsers",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
            });

        services.AddAuthorization();

        // Application Services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IWorkspaceService, WorkspaceService>();
        services.AddScoped<IPageService, PageService>();
        services.AddScoped<IPageAuthorizationService, PageAuthorizationService>();
        services.AddScoped<ISearchService, SearchService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IShareService, ShareService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IFileService, FileService>();
        services.AddScoped<IAiEngine, DefaultAiEngine>();
        services.AddScoped<IAiService, AiService>();

        return services;
    }
}
