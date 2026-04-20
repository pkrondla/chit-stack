using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Global;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Infrastructure.Data;

public class GlobalDbContext : DbContext, IGlobalDbContext
{
    public GlobalDbContext(DbContextOptions<GlobalDbContext> options) : base(options)
    {
    }

    public DbSet<GlobalTenant> Tenants => Set<GlobalTenant>();
    public DbSet<GlobalUser> Users => Set<GlobalUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<GlobalTenant>(e =>
        {
            e.ToTable("Tenants");
            e.HasKey(x => x.Id);
        });

        modelBuilder.Entity<GlobalUser>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId);
        });
    }
}
