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
            
            // Transactional Toggles
            existing.NotifyOnReceipt = settings.NotifyOnReceipt;
            existing.NotifyOnAuctionWon = settings.NotifyOnAuctionWon;
            existing.NotifyOnDividend = settings.NotifyOnDividend;
            existing.NotifyOnDemand = settings.NotifyOnDemand;
            existing.NotifyOnReconciliation = settings.NotifyOnReconciliation;
            existing.NotifyOnPayout = settings.NotifyOnPayout;
            
            _context.TenantSettings.Update(existing);
        }
        
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("templates")]
    public async Task<ActionResult<IEnumerable<NotificationTemplate>>> GetTemplates()
    {
        var templates = await _context.NotificationTemplates.ToListAsync();
        if (!templates.Any())
        {
            // Seed defaults if empty
            templates = GetDefaultTemplates();
            _context.NotificationTemplates.AddRange(templates);
            await _context.SaveChangesAsync();
        }
        return templates;
    }

    [HttpPut("templates/{id}")]
    public async Task<IActionResult> UpdateTemplate(int id, NotificationTemplate template)
    {
        if (id != template.Id) return BadRequest();
        _context.Entry(template).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private List<NotificationTemplate> GetDefaultTemplates()
    {
        return new List<NotificationTemplate>
        {
            new NotificationTemplate { Name = "ReceiptConfirmation", TitleTemplate = "Payment Received", MessageTemplate = "Dear {MemberName}, we received ₹{Amount} for {ChitGroup}. Balance: ₹{Balance}. Receipt: {ReceiptNo}.", Placeholders = "{MemberName}, {Amount}, {ChitGroup}, {Balance}, {ReceiptNo}" },
            new NotificationTemplate { Name = "AuctionWinner", TitleTemplate = "Congratulations!", MessageTemplate = "Dear {MemberName}, you won the auction for {ChitGroup} with bid ₹{BidAmount}. Net Payout: ₹{Payout}.", Placeholders = "{MemberName}, {ChitGroup}, {BidAmount}, {Payout}" },
            new NotificationTemplate { Name = "DividendCredit", TitleTemplate = "Dividend Alert", MessageTemplate = "Dividend of ₹{Amount} credited for {ChitGroup}. Next installment: ₹{NetInstallment}.", Placeholders = "{Amount}, {ChitGroup}, {NetInstallment}" },
            new NotificationTemplate { Name = "DemandAlert", TitleTemplate = "Installment Due", MessageTemplate = "Installment for {Month} is ready: ₹{Amount}. Due on {DueDate}. Group: {ChitGroup}.", Placeholders = "{Month}, {Amount}, {DueDate}, {ChitGroup}" },
            new NotificationTemplate { Name = "ReconciliationApproval", TitleTemplate = "Collections Approved", MessageTemplate = "Your submission for {Date} (₹{Amount}) has been approved. Status: {Status}.", Placeholders = "{Date}, {Amount}, {Status}" }
        };
    }
    [HttpGet("recent")]
    public async Task<ActionResult<IEnumerable<Notification>>> GetRecentNotifications()
    {
        return await _context.Notifications
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendCustomNotification([FromBody] SendNotificationRequest request)
    {
        // 1. Specific Users
        if (request.UserIds != null && request.UserIds.Any())
        {
            foreach (var userId in request.UserIds)
            {
                await _notificationService.SendNotificationAsync(
                    userId, request.Title, request.Message, request.Type, request.ActionUrl, request.Channels);
            }
        }
        
        // 2. Specific Members (including those without accounts)
        if (request.MemberIds != null && request.MemberIds.Any())
        {
            foreach (var memberId in request.MemberIds)
            {
                await _notificationService.SendMemberNotificationAsync(
                    memberId, request.Title, request.Message, request.Type, request.Channels);
            }
        }

        // 3. User Role Based
        if (!string.IsNullOrEmpty(request.UserRole))
        {
            var usersInRole = await _context.Users
                .Where(u => u.Role == request.UserRole)
                .Select(u => u.Id)
                .ToListAsync();

            foreach (var userId in usersInRole)
            {
                await _notificationService.SendNotificationAsync(
                    userId, request.Title, request.Message, request.Type, request.ActionUrl, request.Channels);
            }
        }
        
        // 4. All Members
        if (request.AllMembers == true)
        {
            var allMemberIds = await _context.Members.Select(m => m.Id).ToListAsync();
            foreach (var memberId in allMemberIds)
            {
                await _notificationService.SendMemberNotificationAsync(
                    memberId, request.Title, request.Message, request.Type, request.Channels);
            }
        }
            
        return Ok(new { message = "Broadcast initiated successfully" });
    }
}

public class SendNotificationRequest
{
    public List<int>? UserIds { get; set; }
    public List<int>? MemberIds { get; set; }
    public string? UserRole { get; set; }
    public bool? AllMembers { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;
    public string? ActionUrl { get; set; }
    public NotificationChannels? Channels { get; set; }
}

public class TestNotificationRequest
{
    public int UserId { get; set; }
    public string Message { get; set; } = string.Empty;
}
