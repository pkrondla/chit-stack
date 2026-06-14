using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Global;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace ChitStack.Infrastructure.Global.Services;

/// <summary>
/// DB-backed settings store with a 5-minute in-process cache.
/// Invalidated automatically on every write.
/// </summary>
public sealed class GlobalSettingsService : IGlobalSettingsService
{
    private const string CacheKey = "GlobalSettings_All";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    private readonly IDbContextFactory<Data.GlobalDbContext> _dbFactory;
    private readonly IMemoryCache _cache;
    private readonly ILogger<GlobalSettingsService> _logger;

    public GlobalSettingsService(
        IDbContextFactory<Data.GlobalDbContext> dbFactory,
        IMemoryCache cache,
        ILogger<GlobalSettingsService> logger)
    {
        _dbFactory = dbFactory;
        _cache = cache;
        _logger = logger;
    }

    public async Task<string?> GetAsync(string group, string key, CancellationToken ct = default)
    {
        var all = await LoadAsync(ct);
        return all.FirstOrDefault(s => s.SettingGroup == group && s.SettingKey == key)?.SettingValue;
    }

    public async Task<IReadOnlyList<GlobalSettingDto>> GetAllAsync(CancellationToken ct = default)
    {
        var all = await LoadAsync(ct);
        return all.Select(s => new GlobalSettingDto(
            s.SettingGroup,
            s.SettingKey,
            s.IsSecret ? null : s.SettingValue,   // mask secrets in API responses
            s.Description,
            s.IsSecret)).ToList();
    }

    public async Task UpsertAsync(
        string group,
        string key,
        string? value,
        string modifiedBy,
        CancellationToken ct = default)
    {
        await using var db = await _dbFactory.CreateDbContextAsync(ct);

        var existing = await db.Set<GlobalSetting>()
            .FirstOrDefaultAsync(s => s.SettingGroup == group && s.SettingKey == key, ct);

        if (existing is null)
        {
            db.Set<GlobalSetting>().Add(new GlobalSetting
            {
                SettingGroup = group,
                SettingKey = key,
                SettingValue = value,
                LastModifiedAt = DateTime.UtcNow,
                LastModifiedBy = modifiedBy
            });
        }
        else
        {
            existing.SettingValue = value;
            existing.LastModifiedAt = DateTime.UtcNow;
            existing.LastModifiedBy = modifiedBy;
        }

        await db.SaveChangesAsync(ct);

        _cache.Remove(CacheKey);
        _logger.LogInformation("GlobalSetting updated: {Group}.{Key} by {By}", group, key, modifiedBy);
    }

    private async Task<List<GlobalSetting>> LoadAsync(CancellationToken ct)
    {
        if (_cache.TryGetValue(CacheKey, out List<GlobalSetting>? cached) && cached is not null)
            return cached;

        await using var db = await _dbFactory.CreateDbContextAsync(ct);
        var settings = await db.Set<GlobalSetting>().AsNoTracking().ToListAsync(ct);

        _cache.Set(CacheKey, settings, CacheDuration);
        return settings;
    }
}
