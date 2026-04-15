using ChitStack.API.Services;
using ChitStack.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.API.Controllers;

[Authorize(Roles = "Admin,Manager,Staff,Subscriber")]
[ApiController]
[Route("api/[controller]")]
public class VoiceController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IAzureSpeechSynthesisService _speechSynthesisService;
    private readonly ILogger<VoiceController> _logger;

    public VoiceController(
        IApplicationDbContext context,
        IAzureSpeechSynthesisService speechSynthesisService,
        ILogger<VoiceController> logger)
    {
        _context = context;
        _speechSynthesisService = speechSynthesisService;
        _logger = logger;
    }

    [HttpPost("synthesize")]
    public async Task<IActionResult> Synthesize(
        [FromBody] VoiceSynthesisRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new { error = "Text is required." });
        }

        var settings = await _context.TenantSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings is null || !settings.LiveRoomTtsEnabled)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                code = "TtsDisabledForTenant",
                error = "Live Room TTS is disabled for this tenant."
            });
        }

        var languageCode = !string.IsNullOrWhiteSpace(request.LanguageCode)
            ? request.LanguageCode
            : settings.PreferredAuctionVoiceLanguage;

        try
        {
            var audio = await _speechSynthesisService.SynthesizeAsync(
                request.Text,
                languageCode,
                cancellationToken);

            return File(audio, "audio/mpeg");
        }
        catch (OperationCanceledException)
        {
            return StatusCode(StatusCodes.Status408RequestTimeout, new { error = "Speech synthesis timed out." });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to synthesize speech for event {EventType} and auction {AuctionId}.",
                request.EventType,
                request.AuctionId);
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "Failed to synthesize speech." });
        }
    }
}

public class VoiceSynthesisRequest
{
    public int AuctionId { get; set; }
    public string? EventType { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? LanguageCode { get; set; }
}
