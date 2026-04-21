using ChitStack.Domain.Global;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Common.Interfaces;

public interface IGlobalDbContext
{
    DbSet<GlobalTenant> Tenants { get; }
    DbSet<GlobalUser> Users { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
