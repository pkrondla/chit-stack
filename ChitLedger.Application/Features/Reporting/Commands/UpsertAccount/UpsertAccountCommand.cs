using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Reporting.Commands.UpsertAccount;

public class UpsertAccountCommand : IRequest<Result<int>>
{
    public int? Id { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string AccountCode { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Asset, Liability, Income, Expense
    public string? SystemRole { get; set; }
    public string? BankDetails { get; set; }
}

public class UpsertAccountHandler : IRequestHandler<UpsertAccountCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public UpsertAccountHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(UpsertAccountCommand request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<AccountType>(request.Type, true, out var type))
            return Result<int>.Failure("Invalid Account Type.");

        AccountHead? account;

        if (request.Id.HasValue && request.Id.Value > 0)
        {
            account = await _context.AccountHeads.FindAsync(new object[] { request.Id.Value }, cancellationToken);
            if (account == null) return Result<int>.Failure("Account not found.");
        }
        else
        {
            // Check for duplicate code
            if (await _context.AccountHeads.AnyAsync(a => a.AccountCode == request.AccountCode, cancellationToken))
                return Result<int>.Failure($"Account code '{request.AccountCode}' already exists.");

            account = new AccountHead();
            _context.AccountHeads.Add(account);
        }

        account.AccountName = request.AccountName;
        account.AccountCode = request.AccountCode;
        account.Type = type;
        account.SystemRole = request.SystemRole;
        account.BankDetails = request.BankDetails;

        await _context.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(account.Id);
    }
}
