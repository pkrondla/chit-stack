using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.ChitGroups.Commands.UpdateChitGroup;

public class UpdateChitGroupCommand : IRequest<Result<int>>
{
    public int Id { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public decimal ChitValue { get; set; }
    public int DurationMonths { get; set; }
    public decimal ForemanCommissionPercent { get; set; }
    // Auction Schedule
    public string? AuctionScheduleMode { get; set; }
    public string? AuctionDayOfMonth { get; set; }
    public int? AuctionWeekNumber { get; set; }
    public int? AuctionDayOfWeek { get; set; }
    public string? AuctionTime { get; set; }
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
    private readonly ITenantService _tenantService;
    private readonly IBranchService _branchService;

    public UpdateChitGroupHandler(IApplicationDbContext context, ITenantService tenantService, IBranchService branchService)
    {
        _context = context;
        _tenantService = tenantService;
        _branchService = branchService;
    }

    public async Task<Result<int>> Handle(UpdateChitGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups
            .IgnoreQueryFilters()
            .Include(g => g.Tickets)
            .FirstOrDefaultAsync(g => g.Id == request.Id, cancellationToken);

        if (group == null)
            return Result<int>.Failure($"Group with ID {request.Id} not found.");

        // Fix Group Branch/Tenant if missing (0)
        if (group.TenantId == 0) group.TenantId = _tenantService.TenantId;
        if (group.BranchId == 0 && _branchService.BranchId.HasValue) group.BranchId = _branchService.BranchId.Value;


        // Ensure Foreman Ticket #1 exists and is correctly configured
        var ticket1 = await _context.Tickets
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.ChitGroupId == group.Id && t.TicketNumber == 1, cancellationToken);
            
        if (ticket1 == null)
        {
            ticket1 = new Ticket
            {
                ChitGroupId = group.Id,
                TicketNumber = 1,
                IsForeman = true,
                MemberId = null,
                Status = TicketStatus.Active,
                BranchId = group.BranchId,
                TenantId = group.TenantId
            };
            _context.Tickets.Add(ticket1);
            if (group.Tickets != null) group.Tickets.Add(ticket1);
        }
        else 
        {
            // Forcefully repair even an existing ticket to ensure it's visible and correctly behavior-wise
            ticket1.IsForeman = true;
            ticket1.MemberId = null;
            ticket1.Status = TicketStatus.Active;
            ticket1.BranchId = group.BranchId;
            ticket1.TenantId = group.TenantId;
        }

        group.GroupName = request.GroupName;
        group.ForemanCommissionPercent = request.ForemanCommissionPercent;

        // Schedule can be updated even if active (affects future generations)
        group.AuctionScheduleMode = request.AuctionScheduleMode;
        group.AuctionDayOfMonth = request.AuctionDayOfMonth;
        group.AuctionWeekNumber = request.AuctionWeekNumber;
        group.AuctionDayOfWeek = request.AuctionDayOfWeek;
        group.AuctionTime = !string.IsNullOrEmpty(request.AuctionTime) && TimeOnly.TryParse(request.AuctionTime, out var t) ? t : null;

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
