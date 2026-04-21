namespace ChitStack.API.Services;

public interface IAzureSpeechSynthesisService
{
    Task<byte[]> SynthesizeAsync(
        string text,
        string languageCode,
        CancellationToken cancellationToken = default);
}
