using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;

namespace ChitStack.Application.Features.Settings.Queries;

public class GetSettingsQuery : IRequest<Result<IReadOnlyList<GlobalSettingDto>>> { }

public class GetSettingsHandler : IRequestHandler<GetSettingsQuery, Result<IReadOnlyList<GlobalSettingDto>>>
{
    private readonly IGlobalSettingsService _settings;

    public GetSettingsHandler(IGlobalSettingsService settings) => _settings = settings;

    public async Task<Result<IReadOnlyList<GlobalSettingDto>>> Handle(
        GetSettingsQuery request,
        CancellationToken cancellationToken)
    {
        var all = await _settings.GetAllAsync(cancellationToken);
        return Result<IReadOnlyList<GlobalSettingDto>>.Success(all);
    }
}
