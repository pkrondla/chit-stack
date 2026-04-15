namespace ChitStack.API.Services;

public class AzureSpeechOptions
{
    public string Key { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string DefaultVoice { get; set; } = "en-IN-NeerjaNeural";
    public string OutputFormat { get; set; } = "audio-24khz-48kbitrate-mono-mp3";
}
