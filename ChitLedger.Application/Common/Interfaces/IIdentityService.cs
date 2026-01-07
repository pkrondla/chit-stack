using ChitLedger.Domain.Common;

namespace ChitLedger.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<string> GetUserNameAsync(int userId);
    Task<bool> IsInRoleAsync(int userId, string role);
    Task<bool> AuthorizeAsync(int userId, string policyName);
    Task<(Result<string> Result, int UserId)> CreateUserAsync(string userName, string password);
    Task<Result<string>> DeleteUserAsync(int userId);
}
