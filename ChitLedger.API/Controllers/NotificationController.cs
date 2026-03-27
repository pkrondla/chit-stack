using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Entities;
using ChitLedger.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly TenantDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUserService;

    public NotificationController(
        TenantDbContext context, 
        INotificationService notificationService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _notificationService = notificationService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications([FromQuery] bool onlyUnread = false)
    {
        var userId = int.Parse(_currentUserService.UserId ?? "0");
        var query = _context.Notifications
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .AsQueryable();

        if (onlyUnread)
        {
            query = query.Where(x => !x.IsRead);
        }

        return await query.ToListAsync();
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = int.Parse(_currentUserService.UserId ?? "0");
        var notification = await _context.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        
        if (notification == null) return NotFound();

        notification.IsRead = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = int.Parse(_currentUserService.UserId ?? "0");
        var notifications = await _context.Notifications.Where(x => x.UserId == userId && !x.IsRead).ToListAsync();
        
        foreach (var n in notifications)
        {
            n.IsRead = true;
        }
        
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        var userId = int.Parse(_currentUserService.UserId ?? "0");
        var notification = await _context.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        
        if (notification == null) return NotFound();

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("settings")]
    public async Task<ActionResult<UserNotificationSetting>> GetSettings()
    {
        var userId = int.Parse(_currentUserService.UserId ?? "0");
        return await _notificationService.GetUserSettingsAsync(userId);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings(UserNotificationSetting settings)
    {
        var userId = int.Parse(_currentUserService.UserId ?? "0");
        if (settings.UserId != userId) return BadRequest();
        
        await _notificationService.UpdateUserSettingsAsync(settings);
        return NoContent();
    }
}
