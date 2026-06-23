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

        // Register both factory (for singleton-safe services) and scoped context (for request handlers)
        services.AddDbContextFactory<GlobalDbContext>(options =>
            options.UseSqlServer(globalConnectionString));

        services.AddDbContext<GlobalDbContext>(options =>
            options.UseSqlServer(globalConnectionString));

        services.AddScoped<IGlobalDbContext>(provider => provider.GetRequiredService<GlobalDbContext>());

        services.AddMemoryCache();

        services.AddSingleton<IGlobalSettingsService, GlobalSettingsService>();
        services.AddScoped<IGlobalTokenService, GlobalTokenService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IDemoStampService, DemoStampService>();
        services.AddScoped<IAffiliateCodeGenerator, AffiliateCodeGenerator>();

        services.AddHttpClient();

        return services;
    }
}
