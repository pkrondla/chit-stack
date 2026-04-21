using ChitStack.Domain.Common;

namespace ChitStack.Application.Common.Interfaces;

public interface IAccountResolutionService
{
    Task<Result<string>> GetAccountCodeByRoleAsync(string systemRole, CancellationToken cancellationToken);
}
