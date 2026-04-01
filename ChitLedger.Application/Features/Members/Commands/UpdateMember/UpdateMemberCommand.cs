using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Members.Commands.UpdateMember;

public class UpdateMemberCommand : IRequest<Result<int>>
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PanNumber { get; set; }
    public string? PanDocumentUrl { get; set; }
    public string? AadhaarNumber { get; set; }
    public string? AadhaarDocumentUrl { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Address { get; set; }
    public bool? InPortalEnabled { get; set; }
    public bool? WhatsAppEnabled { get; set; }
    public bool? SmsEnabled { get; set; }
    public bool? EmailEnabled { get; set; }
}

public class UpdateMemberValidator : AbstractValidator<UpdateMemberCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateMemberValidator(IApplicationDbContext context)
    {
        _context = context;

        RuleFor(v => v.FullName)
            .NotEmpty().WithMessage("Full Name is required.");

        RuleFor(v => v.PhoneNumber)
            .NotEmpty()
            .Matches(@"^[0-9]{10}$").WithMessage("Phone number must be 10 digits.")
            .MustAsync(BeUniqueMobile).WithMessage("A different member with this mobile number already exists.");
    }

    private async Task<bool> BeUniqueMobile(UpdateMemberCommand command, string phoneNumber, CancellationToken cancellationToken)
    {
        return await _context.Members
            .AllAsync(m => m.PhoneNumber != phoneNumber || m.Id == command.Id, cancellationToken);
    }
}

public class UpdateMemberHandler : IRequestHandler<UpdateMemberCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public UpdateMemberHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(UpdateMemberCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Members.FindAsync(new object[] { request.Id }, cancellationToken);

        if (entity == null)
        {
            return Result<int>.Failure("Member not found.");
        }

        entity.FullName = request.FullName;
        entity.PhoneNumber = request.PhoneNumber;
        entity.Email = request.Email;
        entity.PanNumber = request.PanNumber;
        entity.AadhaarNumber = request.AadhaarNumber;
        entity.Address = request.Address;

        if (request.InPortalEnabled.HasValue) entity.InPortalEnabled = request.InPortalEnabled.Value;
        if (request.WhatsAppEnabled.HasValue) entity.WhatsAppEnabled = request.WhatsAppEnabled.Value;
        if (request.SmsEnabled.HasValue) entity.SmsEnabled = request.SmsEnabled.Value;
        if (request.EmailEnabled.HasValue) entity.EmailEnabled = request.EmailEnabled.Value;

        // Only overwrite document URLs if new ones were successfully uploaded and passed in
        if (!string.IsNullOrEmpty(request.PanDocumentUrl))
        {
            entity.PanDocumentUrl = request.PanDocumentUrl;
        }

        if (!string.IsNullOrEmpty(request.AadhaarDocumentUrl))
        {
            entity.AadhaarDocumentUrl = request.AadhaarDocumentUrl;
        }

        if (!string.IsNullOrEmpty(request.PhotoUrl))
        {
            entity.PhotoUrl = request.PhotoUrl;
        }

        // Check if KYC is now satisfied
        entity.KycVerified = !string.IsNullOrEmpty(entity.PanNumber) && !string.IsNullOrEmpty(entity.AadhaarNumber);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(entity.Id);
    }
}
