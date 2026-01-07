using ChitLedger.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ChitLedger.Infrastructure.Services;

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int TenantId
    {
        get
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return 0;

            var tenantClaim = context.User.FindFirst("TenantId");
            if (tenantClaim != null && int.TryParse(tenantClaim.Value, out int tenantId))
            {
                return tenantId;
            }

            // Fallback: Check Header
            if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var headerValue))
            {
                if (int.TryParse(headerValue, out int headerId))
                {
                    return headerId;
                }
            }

            return 0; // Or throw exception
        }
    }

    public string? ConnectionString => string.Empty; // TODO: Lookup from Global DB based on TenantId

    public Task<int> GetTenantIdAsync()
    {
        return Task.FromResult(TenantId);
    }
}
