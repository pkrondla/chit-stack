namespace ChitStack.Application.Common;

/// <summary>
/// Selects infrastructure registration for the platform (global) API host vs a tenant API host.
/// </summary>
public enum ApplicationHostKind
{
    GlobalWebApi = 0,
    TenantWebApi = 1
}
