using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Global;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Infrastructure.Global.Data;

public class GlobalDbContext : DbContext, IGlobalDbContext
{
    public GlobalDbContext(DbContextOptions<GlobalDbContext> options) : base(options)
    {
    }

    public DbSet<GlobalTenant> Tenants => Set<GlobalTenant>();
    public DbSet<GlobalUser> Users => Set<GlobalUser>();
    public DbSet<SoftwareComponent> SoftwareComponents => Set<SoftwareComponent>();
    public DbSet<TenantOrder> TenantOrders => Set<TenantOrder>();
    public DbSet<TenantOrderItem> TenantOrderItems => Set<TenantOrderItem>();
    public DbSet<TenantPaymentTransaction> TenantPaymentTransactions => Set<TenantPaymentTransaction>();

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

        modelBuilder.Entity<SoftwareComponent>(e =>
        {
            e.ToTable("SoftwareComponents");
            e.HasKey(x => x.Id);
        });

        modelBuilder.Entity<TenantOrder>(e =>
        {
            e.ToTable("TenantOrders");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId);
            e.HasMany(x => x.Items)
                .WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId);
            e.HasMany(x => x.PaymentTransactions)
                .WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId);
        });

        modelBuilder.Entity<TenantOrderItem>(e =>
        {
            e.ToTable("TenantOrderItems");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Component)
                .WithMany()
                .HasForeignKey(x => x.ComponentId);
        });

        modelBuilder.Entity<TenantPaymentTransaction>(e =>
        {
            e.ToTable("TenantPaymentTransactions");
            e.HasKey(x => x.Id);
        });
    }
}
