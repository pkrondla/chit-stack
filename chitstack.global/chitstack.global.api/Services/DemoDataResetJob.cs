using ChitStack.Application.Common.Interfaces;
using Hangfire;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace ChitStack.Global.API.Services;

/// <summary>
/// Weekly Hangfire job that resets the demo stamp database to a clean
/// pre-seeded state. Business data for TenantId=1 is removed and re-seeded;
/// the Users table is preserved so trial accounts survive the reset.
/// </summary>
public sealed class DemoDataResetJob
{
    private readonly IGlobalSettingsService _settings;
    private readonly ILogger<DemoDataResetJob> _logger;

    public DemoDataResetJob(IGlobalSettingsService settings, ILogger<DemoDataResetJob> logger)
    {
        _settings = settings;
        _logger = logger;
    }

    [Queue("global-maintenance")]
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("DemoDataResetJob started at {UtcNow}", DateTime.UtcNow);

        var connString   = await _settings.GetAsync(SettingKeys.DemoStamp.Group, SettingKeys.DemoStamp.ConnectionString, cancellationToken);
        var demoTenantId = int.Parse(await _settings.GetAsync(SettingKeys.DemoStamp.Group, SettingKeys.DemoStamp.DemoTenantId, cancellationToken) ?? "1");

        if (string.IsNullOrWhiteSpace(connString))
        {
            _logger.LogWarning("DemoDataResetJob: Demo connection string not configured — skipping.");
            return;
        }

        try
        {
            await using var conn = new SqlConnection(connString);
            await conn.OpenAsync(cancellationToken);

            // Delete in FK-safe order — preserve Users so trial accounts survive the reset
            var tables = new[]
            {
                "AuctionBids", "AuctionAttendances", "Auctions",
                "Receipts", "JournalEntryLines", "JournalEntries",
                "CollectionSubmissions", "Demands",
                "Nominees", "Guarantors", "Tickets",
                "ChitGroups", "Members"
            };

            foreach (var table in tables)
            {
                await ExecAsync(conn, $"DELETE FROM [dbo].[{table}] WHERE [TenantId] = @tid", demoTenantId, cancellationToken);
            }

            _logger.LogInformation("DemoDataResetJob: Cleared demo data for TenantId={TenantId}. Re-seeding...", demoTenantId);

            await SeedAsync(conn, demoTenantId, cancellationToken);

            _logger.LogInformation("DemoDataResetJob completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DemoDataResetJob failed.");
            throw;
        }
    }

    private static async Task SeedAsync(SqlConnection conn, int tenantId, CancellationToken ct)
    {
        // Resolve the HQ branch for this tenant
        int branchId;
        await using (var cmd = new SqlCommand(
            "SELECT TOP 1 [Id] FROM [dbo].[Branches] WHERE [TenantId] = @tid AND [Code] = N'HQ'", conn))
        {
            cmd.Parameters.AddWithValue("@tid", tenantId);
            var result = await cmd.ExecuteScalarAsync(ct);
            if (result is null or DBNull)
            {
                throw new InvalidOperationException($"HQ branch not found for TenantId={tenantId}. Run 002.01.DemoData.sql first.");
            }
            branchId = (int)result;
        }

        // Chit groups  (GroupStatus enum: 0=Proposed, 1=Active, 2=Completed, 3=Closed)
        const string groupSql = """
            INSERT INTO [dbo].[ChitGroups]
                ([GroupName], [ChitValue], [DurationMonths], [InstallmentAmount],
                 [ForemanCommissionPercent], [Status], [TenantId], [BranchId], [CreatedBy])
            VALUES (@name, @val, @dur, @installment, 5, 1, @tid, @bid, N'System')
            """;

        var groups = new[]
        {
            ("Gold Chit Group - 20L",   2_000_000m, 20, 100_000m),
            ("Silver Chit Group - 10L", 1_000_000m, 20,  50_000m),
            ("Bronze Chit Group - 5L",    500_000m, 12,  41_667m),
        };

        foreach (var (name, chitValue, durationMonths, installment) in groups)
        {
            await using var cmd = new SqlCommand(groupSql, conn);
            cmd.Parameters.AddWithValue("@name",        name);
            cmd.Parameters.AddWithValue("@val",         chitValue);
            cmd.Parameters.AddWithValue("@dur",         durationMonths);
            cmd.Parameters.AddWithValue("@installment", installment);
            cmd.Parameters.AddWithValue("@tid",         tenantId);
            cmd.Parameters.AddWithValue("@bid",         branchId);
            await cmd.ExecuteNonQueryAsync(ct);
        }

        // Members
        const string memberSql = """
            INSERT INTO [dbo].[Members]
                ([FullName], [PhoneNumber], [Email], [Address], [TenantId], [RegistrationBranchId], [CreatedBy])
            VALUES (@name, @phone, @email, @address, @tid, @bid, N'System')
            """;

        var members = new[]
        {
            ("Rajesh Kumar", "9876543210", "rajesh@example.com",  "123 MG Road, Bengaluru"),
            ("Priya Sharma", "9876543211", "priya@example.com",   "456 Brigade Road, Bengaluru"),
            ("Suresh Reddy", "9876543212", "suresh@example.com",  "789 Residency Rd, Bengaluru"),
            ("Anitha Nair",  "9876543213", "anitha@example.com",  "12 Koramangala, Bengaluru"),
            ("Venkat Rao",   "9876543214", "venkat@example.com",  "34 Indiranagar, Bengaluru"),
        };

        foreach (var (name, phone, email, address) in members)
        {
            await using var cmd = new SqlCommand(memberSql, conn);
            cmd.Parameters.AddWithValue("@name",    name);
            cmd.Parameters.AddWithValue("@phone",   phone);
            cmd.Parameters.AddWithValue("@email",   email);
            cmd.Parameters.AddWithValue("@address", address);
            cmd.Parameters.AddWithValue("@tid",     tenantId);
            cmd.Parameters.AddWithValue("@bid",     branchId);
            await cmd.ExecuteNonQueryAsync(ct);
        }
    }

    private static async Task ExecAsync(SqlConnection conn, string sql, int tenantId, CancellationToken ct)
    {
        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@tid", tenantId);
        await cmd.ExecuteNonQueryAsync(ct);
    }
}
