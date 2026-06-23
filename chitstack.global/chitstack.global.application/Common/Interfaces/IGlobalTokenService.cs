using ChitStack.Domain.Global;

namespace ChitStack.Application.Common.Interfaces;

public interface IGlobalTokenService
{
    string GenerateToken(GlobalUser user);
    string GenerateAffiliateToken(Affiliate affiliate);
}
