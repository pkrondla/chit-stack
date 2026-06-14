namespace ChitStack.Application.Common.Interfaces;

public interface IDemoStampService
{
    Task CreateDemoUserAsync(
        string email,
        string password,
        string fullName,
        DateTime trialEndDate,
        CancellationToken cancellationToken = default);
}
