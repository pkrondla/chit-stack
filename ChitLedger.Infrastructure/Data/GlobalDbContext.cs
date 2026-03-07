using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Global;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Infrastructure.Data;

public class GlobalDbContext : DbContext, IGlobalDbContext
{
    public GlobalDbContext(DbContextOptions<GlobalDbContext> options) : base(options)
    {
    }

    public DbSet<GlobalTenant> Tenants => Set<GlobalTenant>();
    public DbSet<GlobalUser> Users => Set<GlobalUser>();
}
