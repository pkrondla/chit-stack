using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Entities;
using ChitStack.Infrastructure.Data;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChitStack.Infrastructure.Tenant.Services;

/// <summary>
/// Broadcasts operational events to all non-member tenant staff users.
/// Broadcast() is fire-and-forget; actual fan-out runs in a Hangfire background job.
/// </summary>
public class StaffNotificationService : IStaffNotificationService
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public StaffNotificationService(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient;
    }

    public void Broadcast(string title, string message, NotificationType type = NotificationType.Info)
    {
        _backgroundJobClient.Enqueue<StaffNotificationWorker>(w =>
            w.ProcessAsync(title, message, type));
    }
}

/// <summary>
/// Hangfire-invocable worker that performs the actual staff broadcast.
/// Registered as transient so Hangfire can resolve it with a fresh DI scope.
/// </summary>
public class StaffNotificationWorker
{
    private readonly TenantDbContext _context;
    private readonly ITenantNotificationService _hubService;
    private readonly ILogger<StaffNotificationWorker> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public StaffNotificationWorker(
        TenantDbContext context,
        ITenantNotificationService hubService,
        ILogger<StaffNotificationWorker> logger,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _hubService = hubService;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    [Queue("tenant-notifications")]
    [AutomaticRetry(Attempts = 2)]
    public async Task ProcessAsync(string title, string message, NotificationType type)
    {
        var settings = await _context.TenantSettings.AsNoTracking().FirstOrDefaultAsync();
        if (settings == null) return;

        bool inPortal = settings.StaffInPortalAlertsEnabled;
        bool telegram = settings.StaffTelegramAlertsEnabled
                        && !string.IsNullOrEmpty(settings.TelegramBotToken)
                        && !string.IsNullOrEmpty(settings.TelegramChannelId);

        if (!inPortal && !telegram)
        {
            _logger.LogDebug("All staff alert channels are disabled. Skipping broadcast for '{Title}'.", title);
            return;
        }

        var staffUsers = await _context.Users
            .Where(u => u.MemberId == null)
            .Select(u => new { u.Id })
            .ToListAsync();

        if (inPortal)
        {
            foreach (var staff in staffUsers)
            {
                var record = new Notification
                {
                    UserId = staff.Id,
                    MemberId = null,
                    Title = title,
                    Message = message,
                    Type = type,
                    TemplateName = "StaffBroadcast",
                    ChannelsSent = "Portal",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };
                _context.Notifications.Add(record);
            }

            if (staffUsers.Any())
            {
                await _context.SaveChangesAsync();

                foreach (var staff in staffUsers)
                {
                    var saved = await _context.Notifications
                        .OrderByDescending(n => n.CreatedAt)
                        .FirstOrDefaultAsync(n => n.UserId == staff.Id);
                    if (saved != null)
                    {
                        await _hubService.PushNotificationAsync(staff.Id, saved);
                    }
                }
            }
        }

        if (telegram)
        {
            await SendTelegramChannelMessageAsync(
                settings.TelegramBotToken!,
                settings.TelegramChannelId!,
                $"*{EscapeMarkdown(title)}*\\n{EscapeMarkdown(message)}");
        }
    }

    private async Task SendTelegramChannelMessageAsync(string botToken, string channelId, string text)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var url = $"https://api.telegram.org/bot{botToken}/sendMessage";

            var payload = new
            {
                chat_id = channelId,
                text,
                parse_mode = "MarkdownV2"
            };

            var content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(payload),
                System.Text.Encoding.UTF8,
                "application/json");

            var response = await client.PostAsync(url, content);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogError(
                    "Telegram sendMessage failed. Status: {Status}, Body: {Body}",
                    response.StatusCode, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending Telegram channel message.");
        }
    }

    private static string EscapeMarkdown(string text)
    {
        var specialChars = new[] { '_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!' };
        foreach (var ch in specialChars)
        {
            text = text.Replace(ch.ToString(), "\\" + ch);
        }

        return text;
    }
}
