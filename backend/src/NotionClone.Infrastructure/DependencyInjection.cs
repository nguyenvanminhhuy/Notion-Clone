using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Host=localhost;Database=notion_clone_db;Username=postgres;Password=postgres";

        services.AddDbContext<NotionDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }
}
