namespace ChitLedger.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    int? TenantId { get; }
    int? MemberId { get; }
    string? Role { get; }
}
