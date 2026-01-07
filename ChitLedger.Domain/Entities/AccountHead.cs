using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

// Chart of Accounts
public class AccountHead : TenantEntity
{
    public string AccountName { get; set; } = string.Empty;
    public string AccountCode { get; set; } = string.Empty; // e.g. "1001"
    public AccountType Type { get; set; } // Asset, Liability, Income, Expense
    public bool IsSystem { get; set; } = false; // Cannot be deleted
}

public enum AccountType
{
    Asset,
    Liability,
    Income,
    Expense
}
