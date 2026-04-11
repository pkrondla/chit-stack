using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Members.Commands.EnablePortalAccess;

public class EnablePortalAccessCommand : IRequest<Result<int>>
{
    public int MemberId { get; set; }
}

public class EnablePortalAccessHandler : IRequestHandler<EnablePortalAccessCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantService _tenantService;

    public EnablePortalAccessHandler(IApplicationDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<Result<int>> Handle(EnablePortalAccessCommand request, CancellationToken cancellationToken)
    {
        var member = await _context.Members
            .FirstOrDefaultAsync(m => m.Id == request.MemberId, cancellationToken);

        if (member == null)
            return Result<int>.Failure("Member not found.");

        if (string.IsNullOrEmpty(member.PhoneNumber) && string.IsNullOrEmpty(member.Email))
            return Result<int>.Failure("Member must have either a phone number or email to enable portal access.");

        // Check if user already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.MemberId == request.MemberId, cancellationToken);

        if (existingUser != null)
            return Result<int>.Failure("Portal access is already enabled for this member.");

        // Create new user
        var user = new User
            {
                Username = !string.IsNullOrEmpty(member.PhoneNumber) ? member.PhoneNumber : member.Email!,
                Email = member.Email ?? "",
                FullName = member.FullName,
                Role = "Subscriber",
                MemberId = member.Id,
                PasswordHash = "Member@123", // Default password, should be changed or handled via OTP
                TenantId = _tenantService.TenantId
            };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(user.Id);
    }
}
