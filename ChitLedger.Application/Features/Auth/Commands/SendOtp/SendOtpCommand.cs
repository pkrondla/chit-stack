using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Auth.Commands.SendOtp;

public class SendOtpCommand : IRequest<Result<string>>
{
    public string MobileNumber { get; set; } = string.Empty;
}

public class SendOtpHandler : IRequestHandler<SendOtpCommand, Result<string>>
{
    private readonly IApplicationDbContext _context;

    public SendOtpHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(SendOtpCommand request, CancellationToken cancellationToken)
    {
        // Simple tenant resolution for mock
        int tenantId = 1; 

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.MobileNumber && u.TenantId == tenantId, cancellationToken);

        if (user == null)
            return Result<string>.Failure($"Mobile number {request.MobileNumber} not registered for tenant {tenantId}.");

        // In a real app, generate a 6-digit code, save it to DB/Cache, and call SMS API.
        // For now, we mock success.
        return Result<string>.Success("OTP sent successfully. (Use 123456 for demo)");
    }
}
