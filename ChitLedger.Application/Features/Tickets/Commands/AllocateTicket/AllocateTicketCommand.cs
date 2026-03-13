using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Tickets.Commands.AllocateTicket;

public class AllocateTicketCommand : IRequest<Result<List<int>>>
{
    public int ChitGroupId { get; set; }
    public List<int> MemberIds { get; set; } = new();
}

public class AllocateTicketHandler : IRequestHandler<AllocateTicketCommand, Result<List<int>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly IBranchService _branchService;

    public AllocateTicketHandler(IApplicationDbContext context, ITenantService tenantService, IBranchService branchService)
    {
        _context = context;
        _tenantService = tenantService;
        _branchService = branchService;
    }

    public async Task<Result<List<int>>> Handle(AllocateTicketCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate Group
        var group = await _context.ChitGroups
            .IgnoreQueryFilters()
            .Include(g => g.Tickets)
            .FirstOrDefaultAsync(g => g.Id == request.ChitGroupId, cancellationToken);
        if (group == null) return Result<List<int>>.Failure("Chit Group not found.");
        
        if (request.MemberIds == null || !request.MemberIds.Any())
            return Result<List<int>>.Failure("No members selected.");


        // Fix Group Branch/Tenant if missing (0)
        if (group.TenantId == 0) group.TenantId = _tenantService.TenantId;
        if (group.BranchId == 0 && _branchService.BranchId.HasValue) group.BranchId = _branchService.BranchId.Value;

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
            // Ensure even an existing ticket stays in sync with group branch/tenant
            ticket1.IsForeman = true;
            ticket1.MemberId = null;
            ticket1.Status = TicketStatus.Active;
            ticket1.BranchId = group.BranchId;
            ticket1.TenantId = group.TenantId;
        }

        // Check Max Capacity (Total Tickets cannot exceed Duration Months)
        // Since ticket1 logic above ensures ticket #1 exists (either existing or newly added to _context),
        // we check the total count in the group.
        int existingCount = group.Tickets.Count;
        if (existingCount + request.MemberIds.Count > group.DurationMonths)
        {
            int availableSlots = group.DurationMonths - existingCount;
            return Result<List<int>>.Failure($"Cannot enroll {request.MemberIds.Count} members. Only {availableSlots} slots left out of a total {group.DurationMonths} slots (including Foreman ticket).");
        }

        var createdTicketIds = new List<int>();

        // Find existing enrolled members
        var existingMemberIds = group.Tickets.Where(t => t.MemberId != null).Select(t => t.MemberId!.Value).ToHashSet();

        // Find the highest existing ticket number to auto-increment from, but ensure we start at 2 if we just had/added foreman
        int nextTicketNumber = group.Tickets.Any() ? Math.Max(2, group.Tickets.Max(t => t.TicketNumber) + 1) : 2;

        foreach (var memberId in request.MemberIds)
        {
            if (existingMemberIds.Contains(memberId))
                continue; // Prevent enrolling the same member twice

            var member = await _context.Members.FindAsync(new object[] { memberId }, cancellationToken);
            if (member == null) continue; // Skip invalid members

            var ticket = new Ticket
            {
                ChitGroupId = group.Id,
                MemberId = member.Id,
                TicketNumber = nextTicketNumber++
            };

            _context.Tickets.Add(ticket);
            createdTicketIds.Add(ticket.Id); 
        }

        await _context.SaveChangesAsync(cancellationToken);

        // After save, the tracked entities will have their IDs populated.
        // We will just return success with count, or actual IDs if needed, but the frontend currently just relies on success.
        return Result<List<int>>.Success(createdTicketIds);
    }
}
