using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Entities;
using ChitLedger.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.API.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class AdminNotificationController : ControllerBase
{
    private readonly TenantDbContext _context;
    private readonly INotificationService _notificationService;

    public AdminNotificationController(TenantDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<Notification>>> GetUserNotifications(int userId)
    {
        return await _context.Notifications
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    [HttpPost("test")]
    public async Task<IActionResult> SendTestNotification([FromBody] TestNotificationRequest request)
    {
        await _notificationService.SendNotificationAsync(request.UserId, "Test Notification", request.Message, NotificationType.Info);
        return Ok(new { message = "Test notification sent successfully" });
    }

    [HttpGet("config")]
    public async Task<ActionResult<TenantSettings>> GetNotificationConfig()
    {
        var settings = await _context.TenantSettings.FirstOrDefaultAsync();
        return settings ?? new TenantSettings();
    }

    [HttpPut("config")]
    public async Task<IActionResult> UpdateNotificationConfig(TenantSettings settings)
    {
        var existing = await _context.TenantSettings.FirstOrDefaultAsync();
        if (existing == null)
        {
            _context.TenantSettings.Add(settings);
        }
        else
        {
            // Update only notification related fields to prevent overwriting company profile
            existing.SmtpHost = settings.SmtpHost;
            existing.SmtpPort = settings.SmtpPort;
            existing.SmtpUser = settings.SmtpUser;
            existing.SmtpPass = settings.SmtpPass;
            existing.EmailFrom = settings.EmailFrom;
            
            existing.WhatsAppApiUrl = settings.WhatsAppApiUrl;
            existing.WhatsAppApiKey = settings.WhatsAppApiKey;
            existing.WhatsAppSenderNumber = settings.WhatsAppSenderNumber;
            
            existing.SmsApiUrl = settings.SmsApiUrl;
            existing.SmsApiKey = settings.SmsApiKey;
            existing.SmsSenderId = settings.SmsSenderId;
            
            existing.AutoPaymentRemindersEnabled = settings.AutoPaymentRemindersEnabled;
            existing.PaymentReminderDaysBefore = settings.PaymentReminderDaysBefore;
            existing.AutoAuctionRemindersEnabled = settings.AutoAuctionRemindersEnabled;
            existing.AuctionReminderHoursBefore = settings.AuctionReminderHoursBefore;
            
            _context.TenantSettings.Update(existing);
        }
        
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class TestNotificationRequest
{
    public int UserId { get; set; }
    public string Message { get; set; } = string.Empty;
}
