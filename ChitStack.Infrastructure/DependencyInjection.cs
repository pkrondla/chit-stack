using ChitStack.Application.Common.Interfaces;
using ChitStack.Infrastructure.Data;
using ChitStack.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore.Diagnostics;
using QuestPDF.Infrastructure;

namespace ChitStack.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var globalConnectionString = configuration.GetConnectionString("GlobalDBConnection");

        services.AddDbContext<GlobalDbContext>(options =>
            options.UseSqlServer(globalConnectionString));

        services.AddDbContext<TenantDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("TenantDBConnection"))
                   .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IBranchService, BranchService>();
        
        // Identity / Auth Services
        services.AddScoped<IGlobalDbContext>(provider => provider.GetRequiredService<GlobalDbContext>());
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<TenantDbContext>());
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IGSTService, GSTService>();
        services.AddScoped<IJournalService, JournalService>();
        services.AddScoped<IAccountResolutionService, AccountResolutionService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IPdfService, PdfService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IStaffNotificationService, StaffNotificationService>();
        services.AddScoped<StaffNotificationWorker>();
        services.AddScoped<IDailyNotificationProcessor, DailyNotificationWorker>();

        services.AddHttpClient();
        
        // QuestPDF License
        QuestPDF.Settings.License = LicenseType.Community;

        return services;
    }
}
