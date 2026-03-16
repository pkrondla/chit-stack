using ChitLedger.Domain.Common;

namespace ChitLedger.Domain.Entities;

public class AuctionAttendance : BranchEntity
{
    public int AuctionId { get; set; }
    public Auction Auction { get; set; } = null!;

    public int TicketId { get; set; }
    public Ticket Ticket { get; set; } = null!;

    public DateTime? AttendanceTime { get; set; }
    public bool IsPresent { get; set; }
}
