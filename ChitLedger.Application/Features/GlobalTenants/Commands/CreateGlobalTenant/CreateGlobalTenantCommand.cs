using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Global;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.GlobalTenants.Commands.CreateGlobalTenant;

public class CreateGlobalTenantCommand : IRequest<Result<int>>
{
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string State { get; set; } = "Karnataka";
}

public class CreateGlobalTenantHandler : IRequestHandler<CreateGlobalTenantCommand, Result<int>>
{
    private readonly IGlobalDbContext _context;

    public CreateGlobalTenantHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(CreateGlobalTenantCommand request, CancellationToken cancellationToken)
    {
        if (await _context.Tenants.AnyAsync(t => t.Subdomain == request.Subdomain, cancellationToken))
            return Result<int>.Failure("Subdomain (Tenant Key) already exists.");

        var globalTenant = new GlobalTenant
        {
            Name = request.Name,
            Subdomain = request.Subdomain,
            State = request.State,
            ConnectionString = "" // Generate or look up based on subdomain
        };

        _context.Tenants.Add(globalTenant);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(globalTenant.Id);
    }
}
