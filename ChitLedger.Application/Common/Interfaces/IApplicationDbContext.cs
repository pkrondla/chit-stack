using ChitLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<ChitGroup> ChitGroups { get; }
    DbSet<Member> Members { get; }
    DbSet<Ticket> Tickets { get; }
    DbSet<Guarantor> Guarantors { get; }
    DbSet<Nominee> Nominees { get; }
    DbSet<Auction> Auctions { get; }
    DbSet<Receipt> Receipts { get; }
    DbSet<AccountHead> AccountHeads { get; }
    DbSet<JournalEntry> JournalEntries { get; }
    DbSet<JournalEntryLine> JournalEntryLines { get; }
    DbSet<User> Users { get; }
    DbSet<Demand> Demands { get; }
    DbSet<Tenant> Tenants { get; }
    DbSet<TenantSettings> TenantSettings { get; }
    DbSet<HolidayDate> HolidayDates { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
