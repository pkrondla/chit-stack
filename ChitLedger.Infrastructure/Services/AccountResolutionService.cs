using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Infrastructure.Services;

public class AccountResolutionService : IAccountResolutionService
{
    private readonly TenantDbContext _context;

    public AccountResolutionService(TenantDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> GetAccountCodeByRoleAsync(string systemRole, CancellationToken cancellationToken)
    {
        var account = await _context.AccountHeads
            .FirstOrDefaultAsync(a => a.SystemRole == systemRole, cancellationToken);

        if (account == null)
            return Result<string>.Failure($"Configuration missing: No account assigned to system role '{systemRole}'. Please map this role in the Chart of Accounts.");

        return Result<string>.Success(account.AccountCode);
    }
}
