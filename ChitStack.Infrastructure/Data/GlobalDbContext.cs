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
}
