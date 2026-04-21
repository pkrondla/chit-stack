using FluentValidation;
using ChitStack.Application.Common;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace ChitStack.Tenant.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddTenantApplicationServices(this IServiceCollection services)
    {
        var tenantAssembly = Assembly.GetExecutingAssembly();

        services.AddAutoMapper(cfg =>
        {
            cfg.AddMaps(tenantAssembly);
        });
        services.AddValidatorsFromAssembly(tenantAssembly);
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(tenantAssembly);
        });

        return services;
    }
}
