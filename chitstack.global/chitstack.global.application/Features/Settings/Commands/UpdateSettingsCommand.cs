using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;

namespace ChitStack.Application.Features.Settings.Commands;

public class SettingUpdateItem
{
    public string Group { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
}

public class UpdateSettingsCommand : IRequest<Result<bool>>
{
    public List<SettingUpdateItem> Settings { get; set; } = [];
    public string UpdatedBy { get; set; } = string.Empty;
}

public class UpdateSettingsHandler : IRequestHandler<UpdateSettingsCommand, Result<bool>>
{
    private readonly IGlobalSettingsService _settings;

    public UpdateSettingsHandler(IGlobalSettingsService settings) => _settings = settings;

    public async Task<Result<bool>> Handle(
        UpdateSettingsCommand request,
        CancellationToken cancellationToken)
    {
        foreach (var item in request.Settings)
        {
            // Never overwrite a secret with the masked placeholder value
            if (item.Value == "••••••••") continue;

            await _settings.UpsertAsync(
                item.Group,
                item.Key,
                item.Value,
                request.UpdatedBy,
                cancellationToken);
        }
        return Result<bool>.Success(true);
    }
}
