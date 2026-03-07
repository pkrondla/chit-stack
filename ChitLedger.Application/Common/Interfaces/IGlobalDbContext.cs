using ChitLedger.Domain.Global;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Common.Interfaces;

public interface IGlobalDbContext
{
    DbSet<GlobalTenant> Tenants { get; }
    DbSet<GlobalUser> Users { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
