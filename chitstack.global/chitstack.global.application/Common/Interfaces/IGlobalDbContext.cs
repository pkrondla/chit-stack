using ChitStack.Domain.Global;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Common.Interfaces;

public interface IGlobalDbContext
{
    DbSet<GlobalTenant> Tenants { get; }
    DbSet<GlobalUser> Users { get; }
    DbSet<SoftwareComponent> SoftwareComponents { get; }
    DbSet<TenantOrder> TenantOrders { get; }
    DbSet<TenantOrderItem> TenantOrderItems { get; }
    DbSet<TenantPaymentTransaction> TenantPaymentTransactions { get; }
    DbSet<GlobalSetting> GlobalSettings { get; }

    DbSet<Affiliate> Affiliates { get; }
    DbSet<AffiliateCommission> AffiliateCommissions { get; }
    DbSet<AffiliatePayout> AffiliatePayouts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
