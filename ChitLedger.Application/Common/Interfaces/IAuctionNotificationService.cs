namespace ChitLedger.Application.Common.Interfaces;

public interface IAuctionNotificationService
{
    Task NotifyBidAsync(int auctionId, string memberName, decimal amount, string? photoUrl, string source);
}
