using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Reporting.Commands.UpsertAccount;

public class UpsertAccountCommand : IRequest<Result<int>>
{
    public int? Id { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string AccountCode { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Asset, Liability, Income, Expense
    public string? SystemRole { get; set; }
    public string? BankDetails { get; set; }
    public decimal? OpeningBalance { get; set; }
    public int? ParentId { get; set; }
    public bool IsGroup { get; set; }
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
        bool isNew = false;

        if (request.Id.HasValue && request.Id.Value > 0)
        {
            account = await _context.AccountHeads.FindAsync(new object[] { request.Id.Value }, cancellationToken);
            if (account == null) return Result<int>.Failure("Account not found.");
        }
        else
        {
            if (await _context.AccountHeads.AnyAsync(a => a.AccountCode == request.AccountCode, cancellationToken))
                return Result<int>.Failure($"Account code '{request.AccountCode}' already exists.");

            account = new AccountHead();
            _context.AccountHeads.Add(account);
            isNew = true;
        }

        var oldBal = account.OpeningBalance;
        account.AccountName = request.AccountName;
        account.AccountCode = request.AccountCode;
        account.Type = type;
        account.SystemRole = request.SystemRole;
        account.BankDetails = request.BankDetails;
        account.OpeningBalance = request.OpeningBalance ?? 0;
        account.ParentId = request.ParentId;
        account.IsGroup = request.IsGroup;

        await _context.SaveChangesAsync(cancellationToken);

        // Handle Opening Balance Journal Entry automation
        if (isNew || oldBal != account.OpeningBalance)
        {
            await SyncOpeningBalanceEntry(account, cancellationToken);
        }

        return Result<int>.Success(account.Id);
    }

    private async Task SyncOpeningBalanceEntry(AccountHead account, CancellationToken cancellationToken)
    {
        if (account.OpeningBalance == 0)
        {
            // Delete existing opening entry if balance is reset to 0
            var existing = await _context.JournalEntries
                .Where(j => j.EntryType == "Opening" && j.Description.Contains($"Opening balance for {account.AccountName}"))
                .ToListAsync(cancellationToken);
            if (existing.Any())
            {
                _context.JournalEntries.RemoveRange(existing);
                await _context.SaveChangesAsync(cancellationToken);
            }
            return;
        }

        var reAccount = await _context.AccountHeads
            .FirstOrDefaultAsync(a => a.SystemRole == "RetainedEarnings", cancellationToken);
        if (reAccount == null) return; // Pillar missing

        // Find existing or create new
        var entry = await _context.JournalEntries
            .Include(j => j.Lines)
            .FirstOrDefaultAsync(j => j.EntryType == "Opening" && j.Description.Contains($"Opening balance for {account.AccountName}"), cancellationToken);

        if (entry == null)
        {
            entry = new JournalEntry
            {
                EntryDate = new DateTime(DateTime.UtcNow.Year, 1, 1), // Standard start of year
                EntryType = "Opening",
                Description = $"Opening balance for {account.AccountName}",
                TenantId = account.TenantId,
                BranchId = account.BranchId
            };
            _context.JournalEntries.Add(entry);
        }

        entry.Lines.Clear();
        
        // Line 1: The Account itself
        var isDebit = account.Type == AccountType.Asset || account.Type == AccountType.Expense;
        entry.Lines.Add(new JournalEntryLine
        {
            AccountHeadId = account.Id,
            DebitAmount = isDebit ? Math.Abs(account.OpeningBalance) : 0,
            CreditAmount = !isDebit ? Math.Abs(account.OpeningBalance) : 0,
            Description = "Opening Balance",
            TenantId = account.TenantId,
            BranchId = account.BranchId
        });

        // Line 2: The Balancing Account (Retained Earnings)
        entry.Lines.Add(new JournalEntryLine
        {
            AccountHeadId = reAccount.Id,
            DebitAmount = !isDebit ? Math.Abs(account.OpeningBalance) : 0,
            CreditAmount = isDebit ? Math.Abs(account.OpeningBalance) : 0,
            Description = $"Balancing entry for {account.AccountName} opening balance",
            TenantId = account.TenantId,
            BranchId = account.BranchId
        });

        await _context.SaveChangesAsync(cancellationToken);
    }
}
