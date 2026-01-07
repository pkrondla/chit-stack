using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Infrastructure.Data;
using ChitLedger.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ChitLedger.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var globalConnectionString = configuration.GetConnectionString("GlobalConnection");

        services.AddDbContext<GlobalDbContext>(options =>
            options.UseSqlServer(globalConnectionString));

        services.AddDbContext<TenantDbContext>(options =>
            // Dynamic connection handling would happen here or via factory
            // For simplicity in Plan, we use a basic connection for now, 
            // but in real multi-tenant, we replace string based on TenantService
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<ITenantService, TenantService>();
        
        // Identity / Auth Services
        // services.AddTransient<IIdentityService, IdentityService>();
        
        return services;
    }
}
