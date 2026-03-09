using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Infrastructure.Data;

public class TenantDbContext : DbContext, IApplicationDbContext
{
    private readonly ITenantService _tenantService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IBranchService _branchService;

    public TenantDbContext(
        DbContextOptions<TenantDbContext> options,
        ITenantService tenantService,
        ICurrentUserService currentUserService,
        IBranchService branchService)
        : base(options)
    {
        _tenantService = tenantService;
        _currentUserService = currentUserService;
        _branchService = branchService;
    }

    public DbSet<ChitGroup> ChitGroups => Set<ChitGroup>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Guarantor> Guarantors => Set<Guarantor>();
    public DbSet<Nominee> Nominees => Set<Nominee>();
    public DbSet<Auction> Auctions => Set<Auction>();
    public DbSet<Receipt> Receipts => Set<Receipt>();
    public DbSet<AccountHead> AccountHeads => Set<AccountHead>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<JournalEntryLine> JournalEntryLines => Set<JournalEntryLine>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Demand> Demands => Set<Demand>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<UserBranch> UserBranches => Set<UserBranch>();

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
        
        builder.Entity<Member>().Property(x => x.PhoneNumber).HasMaxLength(20);
        builder.Entity<Member>().HasIndex(x => x.PhoneNumber).IsUnique();
        
        // Tenant Filters
        builder.Entity<ChitGroup>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId);
        
        // Branch Filters
        builder.Entity<ChitGroup>().HasQueryFilter(e => _branchService.BranchId == null || e.BranchId == _branchService.BranchId);
        builder.Entity<Ticket>().HasQueryFilter(e => _branchService.BranchId == null || e.BranchId == _branchService.BranchId);
        builder.Entity<Auction>().HasQueryFilter(e => _branchService.BranchId == null || e.BranchId == _branchService.BranchId);
        builder.Entity<Receipt>().HasQueryFilter(e => _branchService.BranchId == null || e.BranchId == _branchService.BranchId);
        builder.Entity<Demand>().HasQueryFilter(e => _branchService.BranchId == null || e.BranchId == _branchService.BranchId);
        builder.Entity<JournalEntry>().HasQueryFilter(e => _branchService.BranchId == null || e.BranchId == _branchService.BranchId);
        builder.Entity<JournalEntryLine>().HasQueryFilter(e => _branchService.BranchId == null || e.BranchId == _branchService.BranchId);

        builder.Entity<JournalEntryLine>()
            .HasOne(l => l.JournalEntry)
            .WithMany(j => j.Lines)
            .HasForeignKey(l => l.JournalEntryId);

        foreach (var relationship in builder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }

        // Seed Default Accounts
        // TEMPORARILY DISABLED: HasData conflicts with BaseEntity inheritance in EF Core 9.0 strict mode without full column mapping.
        // Will implement via a SeederService on app startup instead.
        /*
        builder.Entity<AccountHead>().HasData(
            new { Id = 1, TenantId = 1, AccountName = "Cash on Hand", AccountCode = "ASSET-CASH", AccountType = AccountType.Asset, IsSystemAccount = true, Created = DateTime.MinValue },
            ...
        ); 
        */
        // ... apply to all TenantEntity
    }
    
    // Override SaveChangesAsync to set TenantId and Audit fields
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var currentUser = _currentUserService.UserId ?? "System";

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedBy = currentUser;
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.LastModifiedBy = currentUser;
                    entry.Entity.LastModifiedAt = DateTime.UtcNow;
                    break;
            }
        }

        foreach (var entry in ChangeTracker.Entries<TenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.TenantId = _tenantService.TenantId;
            }
        }
        
        foreach (var entry in ChangeTracker.Entries<BranchEntity>())
        {
            if (entry.State == EntityState.Added && _branchService.BranchId.HasValue)
            {
                entry.Entity.BranchId = _branchService.BranchId.Value;
            }
        }
        
        return await base.SaveChangesAsync(cancellationToken);
    }
}
