using ChitLedger.Application.Common.Constants;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Tenants.Commands.SeedAccountHeads;

public class SeedAccountHeadsCommand : IRequest<Result<int>>
{
    public int TenantId { get; set; }
}

public class SeedAccountHeadsHandler : IRequestHandler<SeedAccountHeadsCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public SeedAccountHeadsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(SeedAccountHeadsCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.AccountHeads
            .AnyAsync(a => a.TenantId == request.TenantId, cancellationToken);

        if (existing) return Result<int>.Failure("Accounts already exist for this tenant.");

        var standardAccounts = new List<AccountHead>
        {
            // Assets
            new() { AccountName = "Cash in Hand", AccountCode = "ASSET-CASH", Type = AccountType.Asset, IsSystem = true, SystemRole = AccountRoles.Cash, TenantId = request.TenantId },
            new() { AccountName = "Main Bank Account", AccountCode = "ASSET-BANK-MAIN", Type = AccountType.Asset, IsSystem = true, SystemRole = AccountRoles.Bank, TenantId = request.TenantId },
            new() { AccountName = "Member Receivables", AccountCode = "RECEIVABLE-MEMBER", Type = AccountType.Asset, IsSystem = true, SystemRole = AccountRoles.MemberReceivable, TenantId = request.TenantId },
            
            // Liabilities
            new() { AccountName = "Prize Money Payable", AccountCode = "LIABILITY-PRIZE-PAYABLE", Type = AccountType.Liability, IsSystem = true, TenantId = request.TenantId },
            new() { AccountName = "Foreman Commission Payable", AccountCode = "LIABILITY-COMMISSION-PAYABLE", Type = AccountType.Liability, IsSystem = true, TenantId = request.TenantId },
            new() { AccountName = "TDS Payable", AccountCode = "LIABILITY-TDS", Type = AccountType.Liability, IsSystem = true, SystemRole = AccountRoles.TdsLiability, TenantId = request.TenantId },
            new() { AccountName = "GST Payable", AccountCode = "LIABILITY-GST", Type = AccountType.Liability, IsSystem = true, SystemRole = AccountRoles.GstLiability, TenantId = request.TenantId },

            // Income
            new() { AccountName = "Foreman Commission Income", AccountCode = "INCOME-COMMISSION", Type = AccountType.Income, IsSystem = true, SystemRole = AccountRoles.CommissionIncome, TenantId = request.TenantId },
            new() { AccountName = "Admission Fees", AccountCode = "INCOME-FEES", Type = AccountType.Income, IsSystem = true, TenantId = request.TenantId },
            new() { AccountName = "Penalty/Late Fee Income", AccountCode = "INCOME-PENALTY", Type = AccountType.Income, IsSystem = true, SystemRole = AccountRoles.LateFeeIncome, TenantId = request.TenantId },
            new() { AccountName = "Cheque Bounce Charges", AccountCode = "INCOME-BOUNCE-CHARGES", Type = AccountType.Income, IsSystem = true, SystemRole = AccountRoles.BounceChargeIncome, TenantId = request.TenantId },

            // Expenses
            new() { AccountName = "Auction Dividend (Loss)", AccountCode = "EXPENSE-DIVIDEND", Type = AccountType.Expense, IsSystem = true, TenantId = request.TenantId },
            new() { AccountName = "Bank Charges", AccountCode = "EXPENSE-BANK-CHARGES", Type = AccountType.Expense, IsSystem = true, TenantId = request.TenantId },
            new() { AccountName = "Office Expenses", AccountCode = "EXPENSE-OFFICE", Type = AccountType.Expense, IsSystem = false, TenantId = request.TenantId }
        };

        _context.AccountHeads.AddRange(standardAccounts);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(standardAccounts.Count);
    }
}
