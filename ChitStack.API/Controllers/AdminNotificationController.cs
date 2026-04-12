using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Entities;
using ChitStack.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.API.Controllers;

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

            // Staff Alert Configuration
            existing.TelegramBotToken = settings.TelegramBotToken;
            existing.TelegramChannelId = settings.TelegramChannelId;
            existing.StaffInPortalAlertsEnabled = settings.StaffInPortalAlertsEnabled;
            existing.StaffTelegramAlertsEnabled = settings.StaffTelegramAlertsEnabled;
            
            _context.TenantSettings.Update(existing);
        }
        
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("templates")]
    public async Task<ActionResult<IEnumerable<NotificationTemplate>>> GetTemplates()
    {
        var existingTemplates = await _context.NotificationTemplates.ToListAsync();
        var defaultTemplates = GetDefaultTemplates();
        
        // 1. Cleanup old friendly names to avoid duplicates
        var legacyNames = new[] { 
            "Payment Receipts", "Auction Winner", "Dividend Credits", "Monthly Demands", 
            "Agent Submissions", "Prize Payouts", "PaymentReminder", "AuctionAlert", "PayoutConfirmation",
            "ReconciliationApproval"
        };
        
        var toDelete = existingTemplates.Where(t => legacyNames.Contains(t.Name)).ToList();
        if (toDelete.Any())
        {
            _context.NotificationTemplates.RemoveRange(toDelete);
            await _context.SaveChangesAsync();
            existingTemplates = await _context.NotificationTemplates.ToListAsync();
        }

        // 2. Sync missing default templates
        bool addedAny = false;
        foreach (var def in defaultTemplates)
        {
            if (!existingTemplates.Any(t => t.Name == def.Name))
            {
                _context.NotificationTemplates.Add(def);
                addedAny = true;
            }
        }
        
        if (addedAny)
        {
            await _context.SaveChangesAsync();
            return await _context.NotificationTemplates.OrderBy(t => t.Name).ToListAsync();
        }
        
        return existingTemplates.OrderBy(t => t.Name).ToList();
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
            new NotificationTemplate 
            { 
                Name = "ReceiptConfirmation", 
                TitleTemplate = "Payment Received", 
                MessageTemplate = "Dear {MemberName}, we received ₹{Amount} for {ChitGroup}. Balance: ₹{Balance}. Receipt: {ReceiptNo}.",
                WhatsAppTemplate = "✅ *Payment Received*\n\nDear {MemberName}, we received *₹{Amount}* for {ChitGroup}. \n\n*Balance*: ₹{Balance}\n*Receipt*: {ReceiptNo}",
                Placeholders = "{MemberName}, {Amount}, {ChitGroup}, {Balance}, {ReceiptNo}" 
            },
            new NotificationTemplate 
            { 
                Name = "AuctionWinner", 
                TitleTemplate = "Congratulations!", 
                MessageTemplate = "Dear {MemberName}, you won the auction for {ChitGroup} with bid ₹{BidAmount}. Net Payout: ₹{Payout}.",
                WhatsAppTemplate = "🎉 *Congratulations!*\n\nDear {MemberName}, you won the auction for *{ChitGroup}*.\n\n*Bid*: ₹{BidAmount}\n*Net Payout*: ₹{Payout}",
                Placeholders = "{MemberName}, {ChitGroup}, {BidAmount}, {Payout}" 
            },
            new NotificationTemplate 
            { 
                Name = "DividendCredit", 
                TitleTemplate = "Dividend Alert", 
                MessageTemplate = "Dividend of ₹{Amount} credited for {ChitGroup}. Next installment: ₹{NetInstallment}.",
                WhatsAppTemplate = "💰 *Dividend Alert*\n\nDividend of *₹{Amount}* credited for {ChitGroup}.\n\n*Next Installment*: ₹{NetInstallment}",
                Placeholders = "{Amount}, {ChitGroup}, {NetInstallment}" 
            },
            new NotificationTemplate 
            { 
                Name = "DemandAlert", 
                TitleTemplate = "Installment Due", 
                MessageTemplate = "Installment for {Month} is ready: ₹{Amount}. Due on {DueDate}. Group: {ChitGroup}.",
                WhatsAppTemplate = "📅 *Installment Due*\n\nInstallment for {Month}: *₹{Amount}*\n*Due Date*: {DueDate}\n*Group*: {ChitGroup}",
                Placeholders = "{Month}, {Amount}, {DueDate}, {ChitGroup}" 
            },
            new NotificationTemplate 
            { 
                Name = "Payment Reminders", 
                TitleTemplate = "Payment Reminder", 
                MessageTemplate = "Gentle reminder: Your installment for {ChitGroup} (₹{Amount}) is due on {DueDate}. Please ensure timely payment.",
                WhatsAppTemplate = "🔔 *Payment Reminder*\n\nYour installment for *{ChitGroup}* is due on *{DueDate}*.\n\n*Amount*: ₹{Amount}",
                Placeholders = "{ChitGroup}, {Amount}, {DueDate}" 
            },
            new NotificationTemplate 
            { 
                Name = "Auction Alerts", 
                TitleTemplate = "Auction Reminder", 
                MessageTemplate = "Auction for {ChitGroup} starts in {Hours} hours. Place your bids in the portal.",
                WhatsAppTemplate = "🔨 *Auction Reminder*\n\nAuction for *{ChitGroup}* starts in {Hours} hours.\n\nBe ready to bid in the portal!",
                Placeholders = "{ChitGroup}, {Hours}" 
            },
            new NotificationTemplate 
            { 
                Name = "PayoutDisbursement", 
                TitleTemplate = "Prize Payout", 
                MessageTemplate = "Your prize payout of ₹{Amount} for {ChitGroup} has been processed. Reference: {RefNo}.",
                WhatsAppTemplate = "🎊 *Prize Payout processed*\n\nYour prize payout of *₹{Amount}* for {ChitGroup} has been processed.\n\n*Ref*: {RefNo}",
                Placeholders = "{Amount}, {ChitGroup}, {RefNo}" 
            }
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
    public IActionResult SendCustomNotification([FromBody] SendNotificationRequest request)
    {
        _notificationService.BroadcastCustomNotificationAsync(
            request.UserIds, request.MemberIds, request.UserRole, request.AllMembers,
            request.Title, request.Message, request.Type, request.ActionUrl, request.Channels);

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
