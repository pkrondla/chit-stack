namespace ChitLedger.Application.Common.Interfaces;

public interface IAuctionNotificationService
{
    Task NotifyBidAsync(int auctionId, int ticketId, string memberName, decimal amount, string? photoUrl, string source);
    Task NotifyAttendanceAsync(int auctionId, int ticketId, string memberName, bool isPresent);
    Task NotifyAuctionStartedAsync(int auctionId, int durationMinutes);
    Task NotifyAuctionClosedAsync(int auctionId, int winningTicketId, string winnerName, decimal winningBid);
    Task NotifyLotteryStartedAsync(int auctionId, IEnumerable<object> participants, int winnerTicketId);
    Task NotifyTieBreakerDetectedAsync(int auctionId, int secondsRemaining);
}
