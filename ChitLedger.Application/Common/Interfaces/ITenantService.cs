namespace ChitLedger.Application.Common.Interfaces;

public interface ITenantService
{
    int TenantId { get; }
    string? ConnectionString { get; }
    Task<int> GetTenantIdAsync();
}
