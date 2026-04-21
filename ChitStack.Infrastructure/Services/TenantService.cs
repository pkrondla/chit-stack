using ChitStack.Application.Common.Interfaces;
using ChitStack.Infrastructure.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace ChitStack.Infrastructure.Services;

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly TenantStampOptions _tenantStampOptions;

    public TenantService(IHttpContextAccessor httpContextAccessor, IOptions<TenantStampOptions> tenantStampOptions)
    {
        _httpContextAccessor = httpContextAccessor;
        _tenantStampOptions = tenantStampOptions.Value;
    }

    public int TenantId
    {
        get
        {
            if (_tenantStampOptions.EnableFixedTenant)
            {
                return _tenantStampOptions.FixedTenantId;
            }

            var context = _httpContextAccessor.HttpContext;
            if (context == null) return 1; // Default to 1 for local testing

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

            return 1; // Default to 1 for local testing instead of 0
        }
    }

    public string? ConnectionString => _tenantStampOptions.FixedTenantConnectionString ?? string.Empty;

    public Task<int> GetTenantIdAsync()
    {
        return Task.FromResult(TenantId);
    }
}
