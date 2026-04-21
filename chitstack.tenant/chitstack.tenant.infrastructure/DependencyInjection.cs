using ChitStack.Application.Common.Interfaces;
using ChitStack.Infrastructure.Data;
using ChitStack.Infrastructure.Tenant.Configuration;
using ChitStack.Infrastructure.Tenant.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QuestPDF.Infrastructure;

namespace ChitStack.Infrastructure.Tenant;

public static class DependencyInjection
{
    public static IServiceCollection AddTenantInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<TenantStampOptions>(configuration.GetSection(TenantStampOptions.SectionName));

        var tenantConnectionString = configuration.GetConnectionString("TenantDBConnection");
        var fixedTenantConnectionString = configuration.GetSection(TenantStampOptions.SectionName).GetValue<string>("FixedTenantConnectionString");
        var effectiveTenantConnectionString = string.IsNullOrWhiteSpace(fixedTenantConnectionString)
            ? tenantConnectionString
            : fixedTenantConnectionString;

        services.AddDbContext<TenantDbContext>(options =>
            options.UseSqlServer(effectiveTenantConnectionString)
                .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IBranchService, BranchService>();

        // Identity / Auth Services
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<TenantDbContext>());
        services.AddScoped<ITenantTokenService, TenantTokenService>();
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
