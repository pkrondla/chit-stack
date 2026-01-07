using ChitLedger.Domain.Global;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Infrastructure.Data;

public class GlobalDbContext : DbContext
{
    public GlobalDbContext(DbContextOptions<GlobalDbContext> options) : base(options)
    {
    }

    public DbSet<GlobalTenant> Tenants => Set<GlobalTenant>();
}
