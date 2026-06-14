namespace ChitStack.Domain.Global;

public class GlobalSetting
{
    public int Id { get; set; }
    public string SettingGroup { get; set; } = string.Empty;
    public string SettingKey { get; set; } = string.Empty;
    public string? SettingValue { get; set; }
    public string? Description { get; set; }
    public bool IsSecret { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
}
