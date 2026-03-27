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
    public DbSet<TenantSettings> TenantSettings => Set<TenantSettings>();
    public DbSet<HolidayDate> HolidayDates => Set<HolidayDate>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<UserBranch> UserBranches => Set<UserBranch>();
    public DbSet<AuctionAttendance> AuctionAttendances => Set<AuctionAttendance>();
    public DbSet<AuctionBid> AuctionBids => Set<AuctionBid>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<CollectionRoute> CollectionRoutes => Set<CollectionRoute>();
    public DbSet<CollectionSubmission> CollectionSubmissions => Set<CollectionSubmission>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UserNotificationSetting> UserNotificationSettings => Set<UserNotificationSetting>();

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
        
        builder.Entity<Ticket>()
            .HasIndex(t => new { t.ChitGroupId, t.TicketNumber })
            .IsUnique();
        
        // Multi-tenancy and Branch Filters (Combined to prevent overwriting)
        builder.Entity<ChitGroup>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<Ticket>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<Auction>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<Receipt>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<Demand>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<JournalEntry>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<JournalEntryLine>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<AuctionAttendance>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<AuctionBid>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<CollectionRoute>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<CollectionSubmission>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId && (_branchService.BranchId == null || x.BranchId == null || x.BranchId == _branchService.BranchId));
        builder.Entity<Notification>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId);
        builder.Entity<UserNotificationSetting>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId);
        
        builder.Entity<Member>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId);
        builder.Entity<Member>().Property(x => x.Latitude).HasPrecision(18, 6);
        builder.Entity<Member>().Property(x => x.Longitude).HasPrecision(18, 6);
        
        builder.Entity<Receipt>().Property(x => x.Latitude).HasPrecision(18, 6);
        builder.Entity<Receipt>().Property(x => x.Longitude).HasPrecision(18, 6);
        
        builder.Entity<AccountHead>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId);
        builder.Entity<User>().HasQueryFilter(x => x.TenantId == _tenantService.TenantId);

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
        var auditEntries = OnBeforeSaveChanges(currentUser);

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
            if (entry.State == EntityState.Added && entry.Entity.TenantId == 0)
            {
                entry.Entity.TenantId = _tenantService.TenantId;
            }
        }
        
        foreach (var entry in ChangeTracker.Entries<BranchEntity>())
        {
            if (entry.State == EntityState.Added && !entry.Entity.BranchId.HasValue && _branchService.BranchId.HasValue)
            {
                entry.Entity.BranchId = _branchService.BranchId.Value;
            }
        }
        
        var result = await base.SaveChangesAsync(cancellationToken);
        await OnAfterSaveChanges(auditEntries, cancellationToken);
        return result;
    }

    private List<AuditEntry> OnBeforeSaveChanges(string userId)
    {
        ChangeTracker.DetectChanges();
        var auditEntries = new List<AuditEntry>();
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            // Audit only core entities
            var entityName = entry.Entity.GetType().Name;
            var auditedEntities = new[] { "AccountHead", "Member", "ChitGroup", "JournalEntry" };
            if (!auditedEntities.Contains(entityName))
                continue;

            var auditEntry = new AuditEntry(entry)
            {
                EntityName = entityName,
                UserId = userId,
                TenantId = _tenantService.TenantId
            };
            auditEntries.Add(auditEntry);

            foreach (var property in entry.Properties)
            {
                string propertyName = property.Metadata.Name;
                if (property.Metadata.IsPrimaryKey())
                {
                    auditEntry.KeyValues[propertyName] = property.CurrentValue;
                    continue;
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.Action = "Insert";
                        auditEntry.NewValues[propertyName] = property.CurrentValue;
                        break;

                    case EntityState.Deleted:
                        auditEntry.Action = "Delete";
                        auditEntry.OldValues[propertyName] = property.OriginalValue;
                        break;

                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            auditEntry.Action = "Update";
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                        }
                        break;
                }
            }
        }

        return auditEntries;
    }

    private Task OnAfterSaveChanges(List<AuditEntry> auditEntries, CancellationToken cancellationToken)
    {
        if (auditEntries == null || auditEntries.Count == 0)
            return Task.CompletedTask;

        foreach (var auditEntry in auditEntries)
        {
            foreach (var prop in auditEntry.TemporaryProperties)
            {
                if (prop.Metadata.IsPrimaryKey())
                {
                    auditEntry.KeyValues[prop.Metadata.Name] = prop.CurrentValue;
                }
                else
                {
                    auditEntry.NewValues[prop.Metadata.Name] = prop.CurrentValue;
                }
            }
            AuditLogs.Add(auditEntry.ToAudit());
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}

public class AuditEntry
{
    public AuditEntry(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
    {
        Entry = entry;
    }

    public Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry Entry { get; }
    public string UserId { get; set; }
    public string EntityName { get; set; }
    public string Action { get; set; }
    public int TenantId { get; set; }
    public Dictionary<string, object> KeyValues { get; } = new Dictionary<string, object>();
    public Dictionary<string, object> OldValues { get; } = new Dictionary<string, object>();
    public Dictionary<string, object> NewValues { get; } = new Dictionary<string, object>();
    public List<Microsoft.EntityFrameworkCore.ChangeTracking.PropertyEntry> TemporaryProperties { get; } = new List<Microsoft.EntityFrameworkCore.ChangeTracking.PropertyEntry>();

    public bool HasTemporaryProperties => TemporaryProperties.Any();

    public AuditLog ToAudit()
    {
        var audit = new AuditLog();
        audit.UserId = UserId;
        audit.Action = Action;
        audit.EntityName = EntityName;
        audit.Timestamp = DateTime.UtcNow;
        audit.TenantId = TenantId;
        audit.EntityId = (int)(KeyValues.FirstOrDefault().Value ?? 0);
        audit.DataBefore = OldValues.Count == 0 ? null : System.Text.Json.JsonSerializer.Serialize(OldValues);
        audit.DataAfter = NewValues.Count == 0 ? null : System.Text.Json.JsonSerializer.Serialize(NewValues);
        return audit;
    }
}
