using ChitStack.Application.Common.Interfaces;
using ChitStack.Infrastructure.Global.Data;
using ChitStack.Infrastructure.Global.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ChitStack.Infrastructure.Global;

public static class DependencyInjection
{
    public static IServiceCollection AddGlobalInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var globalConnectionString = configuration.GetConnectionString("GlobalDBConnection");

        services.AddDbContext<GlobalDbContext>(options =>
            options.UseSqlServer(globalConnectionString));

        services.AddScoped<IGlobalDbContext>(provider => provider.GetRequiredService<GlobalDbContext>());
        services.AddScoped<IGlobalTokenService, GlobalTokenService>();

        services.AddHttpClient();

        return services;
    }
}
