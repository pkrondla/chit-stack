using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user, int tenantId);
}
