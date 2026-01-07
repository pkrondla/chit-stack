using System.Security.Claims;
using ChitLedger.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace ChitLedger.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? UserId => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
    
    public int? TenantId 
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId");
            if (int.TryParse(claim?.Value, out int id)) return id;
            return null;
        }
    }

    public int? MemberId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("MemberId");
            if (int.TryParse(claim?.Value, out int id)) return id;
            return null;
        }
    }

    public string? Role => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);
}
