using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Collections.Commands.UpdateMemberRoute;

public class UpdateMemberRouteCommand : IRequest<Result<int>>
{
    public int MemberId { get; set; }
    public int? RouteId { get; set; }
}

public class UpdateMemberRouteHandler : IRequestHandler<UpdateMemberRouteCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public UpdateMemberRouteHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(UpdateMemberRouteCommand request, CancellationToken cancellationToken)
    {
        var member = await _context.Members.FirstOrDefaultAsync(m => m.Id == request.MemberId, cancellationToken);
        if (member == null) return Result<int>.Failure("Member not found.");

        member.CollectionRouteId = request.RouteId;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(member.Id);
    }
}
