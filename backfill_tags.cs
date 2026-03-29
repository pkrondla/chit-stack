using ChitLedger.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddDbContext<TenantDbContext>(options => 
    options.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=ChitLedgerTenant_default;Trusted_Connection=True;MultipleActiveResultSets=true"));

using var host = builder.Build();
using var scope = host.Services.CreateScope();
var context = scope.ServiceProvider.GetRequiredService<TenantDbContext>();

Console.WriteLine("Backfilling Sub-ledger tags...");

// 1. Backfill Auction Entries
var auctionEntries = await context.JournalEntries
    .Where(e => e.ReferenceType == "Auction")
    .Include(e => e.Lines)
    .ToListAsync();

foreach(var entry in auctionEntries)
{
    var auction = await context.Auctions.FindAsync(entry.ReferenceId);
    if (auction != null)
    {
        foreach(var line in entry.Lines)
        {
            line.ChitGroupId = auction.ChitGroupId;
            line.AuctionId = auction.Id;
            
            // If it's the winner's line (Prize Payable)
            var account = await context.AccountHeads.FindAsync(line.AccountHeadId);
            if (account != null && account.SystemRole == "PrizePayable")
            {
                var winnerTicket = await context.Tickets.FindAsync(auction.WinningTicketId);
                line.MemberId = winnerTicket?.MemberId;
                line.TicketId = winnerTicket?.Id;
            }
        }
    }
}

// 2. Backfill Receipt Entries
var receiptEntries = await context.JournalEntries
    .Where(e => e.ReferenceType == "Receipt")
    .Include(e => e.Lines)
    .ToListAsync();

foreach(var entry in receiptEntries)
{
    var receipt = await context.Receipts.Include(r => r.Ticket).FirstOrDefaultAsync(r => r.Id == entry.ReferenceId);
    if (receipt != null && receipt.Ticket != null)
    {
        foreach(var line in entry.Lines)
        {
            line.MemberId = receipt.Ticket.MemberId;
            line.ChitGroupId = receipt.Ticket.ChitGroupId;
            line.TicketId = receipt.Ticket.Id;
            line.AuctionId = receipt.AuctionId;
        }
    }
}

await context.SaveChangesAsync();
Console.WriteLine("Backfill complete!");
