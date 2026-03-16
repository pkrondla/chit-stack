using ChitLedger.Domain.Common;

namespace ChitLedger.Application.Common.Interfaces;

public interface IAccountResolutionService
{
    Task<Result<string>> GetAccountCodeByRoleAsync(string systemRole, CancellationToken cancellationToken);
}
