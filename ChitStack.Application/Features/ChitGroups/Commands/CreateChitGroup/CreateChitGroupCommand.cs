using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using FluentValidation;
using MediatR;

namespace ChitStack.Application.Features.ChitGroups.Commands.CreateChitGroup;

public class CreateChitGroupCommand : IRequest<Result<int>>
{
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public decimal InstallmentAmount { get; set; }
    public int DurationMonths { get; set; }
    public decimal ForemanCommissionPercent { get; set; } = 5.0m;
    // Auction Schedule
    public string? AuctionScheduleMode { get; set; }  // 'FixedDay' | 'SameWeekday'
    public string? AuctionDayOfMonth { get; set; }
    public int? AuctionWeekNumber { get; set; }
    public int? AuctionDayOfWeek { get; set; }
    public string? AuctionTime { get; set; }  // "HH:mm" string from frontend
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
            Status = GroupStatus.Proposed,
            AuctionScheduleMode = request.AuctionScheduleMode,
            AuctionDayOfMonth = request.AuctionDayOfMonth,
            AuctionWeekNumber = request.AuctionWeekNumber,
            AuctionDayOfWeek = request.AuctionDayOfWeek,
            AuctionTime = !string.IsNullOrEmpty(request.AuctionTime) && TimeOnly.TryParse(request.AuctionTime, out var t) ? t : null,
        };

        _context.ChitGroups.Add(entity);

        // Auto-create Foreman Ticket #1
        var foremanTicket = new Ticket
        {
            ChitGroup = entity,
            TicketNumber = 1,
            IsForeman = true,
            MemberId = null, // Foreman doesn't need a separate Member record
            Status = TicketStatus.Active,
            BranchId = entity.BranchId,
            TenantId = entity.TenantId
        };
        _context.Tickets.Add(foremanTicket);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(entity.Id);
    }
}
