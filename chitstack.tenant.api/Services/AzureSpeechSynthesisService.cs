using System.Text;
using System.Text.Encodings.Web;
using Microsoft.Extensions.Options;

namespace ChitStack.API.Services;

public class AzureSpeechSynthesisService : IAzureSpeechSynthesisService
{
    private readonly HttpClient _httpClient;
    private readonly AzureSpeechOptions _options;
    private readonly ILogger<AzureSpeechSynthesisService> _logger;

    private static readonly IReadOnlyDictionary<string, string> VoiceByLanguage =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["en"] = "en-IN-NeerjaNeural",
            ["hi"] = "hi-IN-SwaraNeural",
            ["ta"] = "ta-IN-PallaviNeural",
            ["te"] = "te-IN-ShrutiNeural",
            ["kn"] = "kn-IN-SapnaNeural",
            ["ml"] = "ml-IN-SobhanaNeural"
        };

    private static readonly IReadOnlyDictionary<string, string> LocaleByLanguage =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["en"] = "en-IN",
            ["hi"] = "hi-IN",
            ["ta"] = "ta-IN",
            ["te"] = "te-IN",
            ["kn"] = "kn-IN",
            ["ml"] = "ml-IN"
        };

    public AzureSpeechSynthesisService(
        HttpClient httpClient,
        IOptions<AzureSpeechOptions> options,
        ILogger<AzureSpeechSynthesisService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<byte[]> SynthesizeAsync(
        string text,
        string languageCode,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.Key) || string.IsNullOrWhiteSpace(_options.Region))
        {
            throw new InvalidOperationException("Azure Speech credentials are not configured.");
        }

        var normalizedLanguage = NormalizeLanguage(languageCode);
        var voiceName = ResolveVoice(normalizedLanguage);
        var locale = ResolveLocale(normalizedLanguage);
        var ssml = BuildSsml(text, locale, voiceName);

        using var request = new HttpRequestMessage(HttpMethod.Post, BuildSynthesisUrl(_options.Region))
        {
            Content = new StringContent(ssml, Encoding.UTF8, "application/ssml+xml")
        };
        request.Headers.TryAddWithoutValidation("Ocp-Apim-Subscription-Key", _options.Key);
        request.Headers.TryAddWithoutValidation("X-Microsoft-OutputFormat", _options.OutputFormat);
        request.Headers.TryAddWithoutValidation("User-Agent", "ChitStack-LiveRoom-TTS");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "Azure Speech synthesis failed. Status: {StatusCode}, Body: {Body}",
                (int)response.StatusCode,
                errorContent);

            throw new InvalidOperationException("Azure Speech synthesis failed.");
        }

        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }

    private string ResolveVoice(string languageCode)
    {
        if (VoiceByLanguage.TryGetValue(languageCode, out var voice))
        {
            return voice;
        }

        return _options.DefaultVoice;
    }

    private static string ResolveLocale(string languageCode)
    {
        if (LocaleByLanguage.TryGetValue(languageCode, out var locale))
        {
            return locale;
        }

        return "en-IN";
    }

    private static string BuildSynthesisUrl(string region)
        => $"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1";

    private static string NormalizeLanguage(string languageCode)
    {
        if (string.IsNullOrWhiteSpace(languageCode))
        {
            return "en";
        }
        
        var normalized = languageCode.Trim().ToLowerInvariant();

        // Accept legacy persisted values and locale-style values as aliases.
        return normalized switch
        {
            "english" or "en-in" or "en_us" or "en-us" => "en",
            "hindi" or "hi-in" => "hi",
            "tamil" or "ta-in" => "ta",
            "telugu" or "te-in" => "te",
            "kannada" or "kn-in" => "kn",
            "malayalam" or "ml-in" => "ml",
            _ => normalized
        };
    }

    private static string BuildSsml(string text, string locale, string voiceName)
    {
        var safeText = HtmlEncoder.Default.Encode(text);
        return
            $"""
            <speak version="1.0" xml:lang="{locale}">
              <voice name="{voiceName}">
                <prosody rate="0%" pitch="0%">{safeText}</prosody>
              </voice>
            </speak>
            """;
    }
}
