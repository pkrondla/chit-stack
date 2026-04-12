using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using ChitStack.Infrastructure.Data;
using ChitStack.Application.Common.Interfaces;

namespace ChitStack.Infrastructure.Data;

public class DesignTimeTenantDbContextFactory : IDesignTimeDbContextFactory<TenantDbContext>
{
    public TenantDbContext CreateDbContext(string[] args)
    {
        IConfigurationRoot configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("C:\\PK\\Source\\chit-stack\\ChitStack.API\\appsettings.json")
            .Build();

        var builder = new DbContextOptionsBuilder<TenantDbContext>();
        var connectionString = configuration.GetConnectionString("TenantDBConnection");

        builder.UseSqlServer(connectionString);

        return new TenantDbContext(
            builder.Options,
            new MockTenantService(),
            new MockCurrentUserService(),
            new MockBranchService());
    }

    private class MockTenantService : ITenantService
    {
        public int TenantId => 1;
        public string? ConnectionString => null;
        public Task<int> GetTenantIdAsync() => Task.FromResult(1);
    }

    private class MockCurrentUserService : ICurrentUserService
    {
        public string? UserId => "Design.Time";
        public int? TenantId => 1;
        public int? MemberId => null;
        public string? Role => "Admin";
    }

    private class MockBranchService : IBranchService
    {
        public int? BranchId => null;
        public void SetBranch(int branchId) { }
    }
}
