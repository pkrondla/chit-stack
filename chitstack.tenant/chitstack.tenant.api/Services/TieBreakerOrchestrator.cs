using System.Collections.Concurrent;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Application.Features.Auctions.Commands.RunLottery;
using MediatR;

namespace ChitStack.API.Services;

public class TieBreakerOrchestrator
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TieBreakerOrchestrator> _logger;
    private readonly ConcurrentDictionary<int, CancellationTokenSource> _activeTieBreakers = new();
    private const int TieBreakerDurationSeconds = 15;

    public TieBreakerOrchestrator(
        IServiceScopeFactory scopeFactory,
        ILogger<TieBreakerOrchestrator> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<bool> StartAsync(int auctionId, CancellationToken cancellationToken = default)
    {
        var cts = new CancellationTokenSource();
        if (!_activeTieBreakers.TryAdd(auctionId, cts))
        {
            return false;
        }

        try
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var notificationService = scope.ServiceProvider.GetRequiredService<IAuctionNotificationService>();
                await notificationService.NotifyTieBreakerDetectedAsync(auctionId, TieBreakerDurationSeconds);
            }

            _ = Task.Run(async () =>
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(TieBreakerDurationSeconds), cts.Token);

                    using var scope = _scopeFactory.CreateScope();
                    var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                    var result = await mediator.Send(new RunLotteryCommand { AuctionId = auctionId }, cts.Token);
                    if (!result.Succeeded)
                    {
                        _logger.LogWarning(
                            "Auto tie-breaker lottery failed for auction {AuctionId}: {Errors}",
                            auctionId,
                            string.Join(", ", result.Errors));
                    }
                }
                catch (OperationCanceledException)
                {
                    _logger.LogDebug("Tie-breaker countdown cancelled for auction {AuctionId}.", auctionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled error in tie-breaker countdown for auction {AuctionId}.", auctionId);
                }
                finally
                {
                    _activeTieBreakers.TryRemove(auctionId, out _);
                }
            }, CancellationToken.None);

            return true;
        }
        catch
        {
            _activeTieBreakers.TryRemove(auctionId, out _);
            cts.Dispose();
            throw;
        }
    }

    public void Cancel(int auctionId)
    {
        if (_activeTieBreakers.TryRemove(auctionId, out var cts))
        {
            cts.Cancel();
            cts.Dispose();
        }
    }
}
