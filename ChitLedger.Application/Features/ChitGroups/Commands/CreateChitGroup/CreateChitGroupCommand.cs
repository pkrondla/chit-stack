using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using FluentValidation;
using MediatR;

namespace ChitLedger.Application.Features.ChitGroups.Commands.CreateChitGroup;

public class CreateChitGroupCommand : IRequest<Result<int>>
{
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public decimal InstallmentAmount { get; set; }
    public int DurationMonths { get; set; }
    public decimal ForemanCommissionPercent { get; set; } = 5.0m;
}

public class CreateChitGroupValidator : AbstractValidator<CreateChitGroupCommand>
{
    public CreateChitGroupValidator()
    {
        RuleFor(v => v.GroupName)
            .NotEmpty().WithMessage("Group name is required.")
            .MaximumLength(100);

        RuleFor(v => v.ChitValue)
            .GreaterThan(0).WithMessage("Chit value must be greater than 0.");

        RuleFor(v => v.DurationMonths)
            .GreaterThan(0).WithMessage("Duration must be greater than 0.");
            
        RuleFor(v => v.InstallmentAmount)
            .GreaterThan(0).WithMessage("Monthly due must be greater than 0.");
            
        RuleFor(v => v)
            .Must(v => v.ChitValue == v.DurationMonths * v.InstallmentAmount)
            .WithMessage("Chit Value must be equal to Monthly Due multiplied by Duration.");
            
        RuleFor(v => v.ForemanCommissionPercent)
            .InclusiveBetween(0, 100).WithMessage("Commission must be between 0 and 100.");
    }
}

public class CreateChitGroupHandler : IRequestHandler<CreateChitGroupCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public CreateChitGroupHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(CreateChitGroupCommand request, CancellationToken cancellationToken)
    {
        var entity = new ChitGroup
        {
            GroupName = request.GroupName,
            ChitValue = request.ChitValue,
            DurationMonths = request.DurationMonths,
            InstallmentAmount = request.InstallmentAmount,
            ForemanCommissionPercent = request.ForemanCommissionPercent,
            Status = GroupStatus.Proposed
        };

        _context.ChitGroups.Add(entity);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(entity.Id);
    }
}
