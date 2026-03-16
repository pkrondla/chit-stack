using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

// Chart of Accounts
public class AccountHead : TenantEntity
{
    public string AccountName { get; set; } = string.Empty;
    public string AccountCode { get; set; } = string.Empty; // e.g. "1001"
    public AccountType Type { get; set; } // Asset, Liability, Income, Expense
    public bool IsSystem { get; set; } = false; // Cannot be deleted
    public string? SystemRole { get; set; } // e.g. "MemberReceivable", "LateFeeIncome"
    public int? BranchId { get; set; } // Branch specific account if null then tenant level
    public string? BankDetails { get; set; } // For Bank type accounts
}

public enum AccountType
{
    Asset,
    Liability,
    Income,
    Expense
}
