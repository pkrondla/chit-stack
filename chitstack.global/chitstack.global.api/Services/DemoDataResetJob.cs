using Hangfire;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ChitStack.Global.API.Services;

/// <summary>
/// Weekly Hangfire job that resets the demo stamp database to a clean
/// pre-seeded state. Only demo tenant (TenantId=1) data is removed;
/// the Users table is preserved so trial accounts remain accessible.
/// </summary>
public sealed class DemoDataResetJob
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DemoDataResetJob> _logger;

    public DemoDataResetJob(IConfiguration configuration, ILogger<DemoDataResetJob> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    [Queue("global-maintenance")]
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("DemoDataResetJob started at {UtcNow}", DateTime.UtcNow);

        var connectionStringName = _configuration["DemoStamp:ConnectionStringName"] ?? "TenantDBConnection";
        var connString = _configuration.GetConnectionString(connectionStringName);
        var demoTenantId = int.Parse(_configuration["DemoStamp:DemoTenantId"] ?? "1");

        if (string.IsNullOrWhiteSpace(connString))
        {
            _logger.LogWarning("DemoDataResetJob: Demo connection string not configured, skipping.");
            return;
        }

        try
        {
            await using var conn = new SqlConnection(connString);
            await conn.OpenAsync(cancellationToken);

            // Delete business data for demo tenant — preserve Users so trial accounts survive
            var tables = new[]
            {
                "AuctionBids", "AuctionAttendances", "Auctions",
                "Receipts", "JournalEntryLines", "JournalEntries",
                "CollectionSubmissions", "Demands", "Tickets",
                "Nominees", "Guarantors", "ChitGroups", "Members"
            };

            foreach (var table in tables)
            {
                await ExecuteAsync(conn, $"DELETE FROM [dbo].[{table}] WHERE [TenantId] = @tid", demoTenantId, cancellationToken);
            }

            _logger.LogInformation("DemoDataResetJob: Demo data cleared for TenantId={TenantId}. Re-seeding...", demoTenantId);

            // Re-seed core demo data
            await SeedDemoDataAsync(conn, demoTenantId, cancellationToken);

            _logger.LogInformation("DemoDataResetJob completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DemoDataResetJob failed.");
            throw;
        }
    }

    private static async Task ExecuteAsync(SqlConnection conn, string sql, int tenantId, CancellationToken ct)
    {
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@tid", tenantId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    private static async Task SeedDemoDataAsync(SqlConnection conn, int tenantId, CancellationToken ct)
    {
        // Seed demo chit groups
        const string groupSql = """
            IF NOT EXISTS (SELECT 1 FROM [dbo].[ChitGroups] WHERE [GroupCode] = @code AND [TenantId] = @tid)
            BEGIN
                INSERT INTO [dbo].[ChitGroups]
                    ([GroupCode], [Name], [ChitValue], [Duration], [MemberCount], [MonthlyContribution],
                     [CommissionRate], [Status], [TenantId], [BranchId], [CreatedBy])
                VALUES (@code, @name, @val, @dur, @members, @contrib, 5, 'Active', @tid, 1, 'System')
            END
            """;

        var groups = new[]
        {
            ("DEMO-001", "Gold Chit Group - 20L", 2000000, 20, 20, 100000),
            ("DEMO-002", "Silver Chit Group - 10L", 1000000, 20, 20, 50000),
            ("DEMO-003", "Bronze Chit Group - 5L", 500000, 12, 12, 41667),
        };

        foreach (var (code, name, val, dur, members, contrib) in groups)
        {
            await using var cmd = new SqlCommand(groupSql, conn);
            cmd.Parameters.AddWithValue("@code", code);
            cmd.Parameters.AddWithValue("@name", name);
            cmd.Parameters.AddWithValue("@val", val);
            cmd.Parameters.AddWithValue("@dur", dur);
            cmd.Parameters.AddWithValue("@members", members);
            cmd.Parameters.AddWithValue("@contrib", contrib);
            cmd.Parameters.AddWithValue("@tid", tenantId);
            await cmd.ExecuteNonQueryAsync(ct);
        }
    }
}
