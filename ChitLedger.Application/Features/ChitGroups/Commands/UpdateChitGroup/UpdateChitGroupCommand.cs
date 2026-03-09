using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.ChitGroups.Commands.UpdateChitGroup;

public class UpdateChitGroupCommand : IRequest<Result<int>>
{
    public int Id { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int DurationMonths { get; set; }
    public decimal ForemanCommissionPercent { get; set; }
}

public class UpdateChitGroupValidator : AbstractValidator<UpdateChitGroupCommand>
{
    public UpdateChitGroupValidator()
    {
        RuleFor(v => v.Id).GreaterThan(0).WithMessage("Valid Group ID is required.");
        RuleFor(v => v.GroupName).NotEmpty().WithMessage("Group name is required.").MaximumLength(100);
        RuleFor(v => v.ChitValue).GreaterThan(0).WithMessage("Chit value must be greater than 0.");
        RuleFor(v => v.DurationMonths).GreaterThan(0).WithMessage("Duration must be greater than 0.");
        RuleFor(v => v.ForemanCommissionPercent).InclusiveBetween(0, 100).WithMessage("Commission must be between 0 and 100.");
    }
}

public class UpdateChitGroupHandler : IRequestHandler<UpdateChitGroupCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public UpdateChitGroupHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(UpdateChitGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups.FirstOrDefaultAsync(g => g.Id == request.Id, cancellationToken);

        if (group == null)
            return Result<int>.Failure($"Group with ID {request.Id} not found.");

        group.GroupName = request.GroupName;
        group.ForemanCommissionPercent = request.ForemanCommissionPercent;

        // Business Rule: Only allow updates to Chit Value and Duration if the group is still 'Proposed'
        if (group.Status == GroupStatus.Proposed)
        {
            group.ChitValue = request.ChitValue;
            group.DurationMonths = request.DurationMonths;
            group.InstallmentAmount = request.ChitValue / request.DurationMonths;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(group.Id);
    }
}
