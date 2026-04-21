using ChitStack.Domain.Entities;

namespace ChitStack.Application.Common.Interfaces;

public interface ITenantTokenService
{
    string GenerateToken(User user, int tenantId);
}
