using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Infrastructure.Data;

public class TenantDbContext : DbContext
{
    private readonly ITenantService _tenantService;

    public TenantDbContext(
        DbContextOptions<TenantDbContext> options,
        ITenantService tenantService)
        : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<ChitGroup> ChitGroups => Set<ChitGroup>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Auction> Auctions => Set<Auction>();
    public DbSet<Receipt> Receipts => Set<Receipt>();
    public DbSet<AccountHead> AccountHeads => Set<AccountHead>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<JournalEntryLine> JournalEntryLines => Set<JournalEntryLine>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Enum conversions?
        
        // Global Query Filter for Multi-tenancy (if using shared DB column, 
        // but here we are using separate DBs per tenant usually, OR shared with discriminator.
        // The implementation plan said "Tenant Database context... dynamic connection".
        // If separate DBs, we don't need a filter on TenantId necessarily if the connection itself is isolated.
        // However, Domain entities have TenantId.
        // If we use separate DBs, TenantId might be redundant or just 1 for all.
        // If we use Shared DB, we need filter.
        // Plan says: "Tenant databases: One database per organization... Isolated by physical database separation"
        // SO filter might be redundant but safe.
        // Or if we use Elastic Pools, it is separate DBs.
        
        // Let's add the filter just in case of shared mode fallback, or just ignore TenantId column if physical separation.
        // Actually, if physical separation, TenantId is constant for that DB.
        
        builder.Entity<ChitGroup>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId);
        builder.Entity<Member>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId);
        // ... apply to all TenantEntity
    }
    
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<TenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.TenantId = _tenantService.TenantId;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
