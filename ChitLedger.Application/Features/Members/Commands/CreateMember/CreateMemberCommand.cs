using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using FluentValidation;
using MediatR;

namespace ChitLedger.Application.Features.Members.Commands.CreateMember;

public class CreateMemberCommand : IRequest<Result<int>>
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PanNumber { get; set; }
    public string? AadhaarNumber { get; set; }
    public string? Address { get; set; }
}

public class CreateMemberValidator : AbstractValidator<CreateMemberCommand>
{
    public CreateMemberValidator()
    {
        RuleFor(v => v.FullName).NotEmpty();
        RuleFor(v => v.PhoneNumber)
            .NotEmpty()
            .Matches(@"^[0-9]{10}$").WithMessage("Phone number must be 10 digits.");
        RuleFor(v => v.PanNumber)
            .Matches(@"[A-Z]{5}[0-9]{4}[A-Z]{1}").When(x => !string.IsNullOrEmpty(x.PanNumber))
            .WithMessage("Invalid PAN Number format.");
    }
}

public class CreateMemberHandler : IRequestHandler<CreateMemberCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public CreateMemberHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(CreateMemberCommand request, CancellationToken cancellationToken)
    {
        var entity = new Member
        {
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            Email = request.Email,
            PanNumber = request.PanNumber,
            AadhaarNumber = request.AadhaarNumber,
            Address = request.Address
        };

        _context.Members.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(entity.Id);
    }
}
