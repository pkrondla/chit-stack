using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace ChitStack.Global.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddGlobalApplicationServices(this IServiceCollection services)
    {
        services.AddAutoMapper(cfg => cfg.AddMaps(Assembly.GetExecutingAssembly()));
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
        });

        return services;
    }
}
