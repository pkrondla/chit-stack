using ChitLedger.Application.Common.Interfaces;

namespace ChitLedger.API.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Resolve Tenant
        var tenantService = context.RequestServices.GetRequiredService<ITenantService>();
        
        // This triggers the logic in TenantService (which reads Header/Claim)
        // We might want to store it in Items or just let TenantService be Scoped and hold state.
        // My TenantService implementation was dynamic properties, so it's fine.
        // But if we want to validate existence:
        
        // This is where Global vs Tenant logic happens.
        // For now, simple pass-through to ensure context is available.
        
        await _next(context);
    }
}
