using Hangfire;
using Microsoft.Extensions.Logging;

namespace ChitStack.Global.API.Services;

public sealed class GlobalMaintenanceHeartbeatJob
{
    private readonly ILogger<GlobalMaintenanceHeartbeatJob> _logger;

    public GlobalMaintenanceHeartbeatJob(ILogger<GlobalMaintenanceHeartbeatJob> logger)
    {
        _logger = logger;
    }

    [Queue("global-maintenance")]
    public Task RunAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Global heartbeat job ran at {UtcNow}.", DateTime.UtcNow);
        return Task.CompletedTask;
    }
}
