using ChitStack.Domain.Entities;

namespace ChitStack.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user, int tenantId);
    string GenerateToken(ChitStack.Domain.Global.GlobalUser user);
}
