using ChitStack.Application.Common.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ChitStack.Infrastructure.Global.Services;

public class DemoStampService : IDemoStampService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DemoStampService> _logger;

    public DemoStampService(IConfiguration configuration, ILogger<DemoStampService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task CreateDemoUserAsync(
        string email,
        string password,
        string fullName,
        DateTime trialEndDate,
        CancellationToken cancellationToken = default)
    {
        var connectionStringName = _configuration["DemoStamp:ConnectionStringName"] ?? "TenantDBConnection";
        var connString = _configuration.GetConnectionString(connectionStringName);
        var demoTenantId = int.Parse(_configuration["DemoStamp:DemoTenantId"] ?? "1");

        if (string.IsNullOrWhiteSpace(connString))
        {
            _logger.LogWarning("DemoStampService: Demo connection string not configured. User {Email} not created in demo stamp.", email);
            return;
        }

        await using var conn = new SqlConnection(connString);
        await conn.OpenAsync(cancellationToken);

        // Idempotent — skip if already exists
        const string checkSql = "SELECT COUNT(1) FROM [dbo].[Users] WHERE [Email] = @Email AND [TenantId] = @TenantId";
        await using var checkCmd = new SqlCommand(checkSql, conn);
        checkCmd.Parameters.AddWithValue("@Email", email);
        checkCmd.Parameters.AddWithValue("@TenantId", demoTenantId);
        var count = (int)(await checkCmd.ExecuteScalarAsync(cancellationToken))!;
        if (count > 0)
        {
            _logger.LogDebug("DemoStampService: User {Email} already exists in demo stamp.", email);
            return;
        }

        const string insertSql = """
            INSERT INTO [dbo].[Users]
                ([Username], [PasswordHash], [Email], [FullName], [Role], [TenantId], [TrialEndDate], [CreatedBy])
            VALUES
                (@Username, @PasswordHash, @Email, @FullName, 'Admin', @TenantId, @TrialEndDate, 'Registration')
            """;

        await using var cmd = new SqlCommand(insertSql, conn);
        cmd.Parameters.AddWithValue("@Username", email);
        cmd.Parameters.AddWithValue("@PasswordHash", password);
        cmd.Parameters.AddWithValue("@Email", email);
        cmd.Parameters.AddWithValue("@FullName", fullName);
        cmd.Parameters.AddWithValue("@TenantId", demoTenantId);
        cmd.Parameters.AddWithValue("@TrialEndDate", trialEndDate);
        await cmd.ExecuteNonQueryAsync(cancellationToken);

        _logger.LogInformation("DemoStampService: Created demo user {Email} (trial ends {TrialEnd})", email, trialEndDate);
    }
}
