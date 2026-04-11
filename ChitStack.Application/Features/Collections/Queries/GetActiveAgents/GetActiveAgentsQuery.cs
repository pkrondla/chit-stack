using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Collections.Queries.GetActiveAgents;

public class ActiveAgentDto
{
    public string AgentName { get; set; } = string.Empty;
    public decimal? LastLatitude { get; set; }
    public decimal? LastLongitude { get; set; }
    public DateTime? LastSeen { get; set; }
}

public class GetActiveAgentsQuery : IRequest<Result<List<ActiveAgentDto>>> { }

public class GetActiveAgentsHandler : IRequestHandler<GetActiveAgentsQuery, Result<List<ActiveAgentDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetActiveAgentsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ActiveAgentDto>>> Handle(GetActiveAgentsQuery request, CancellationToken cancellationToken)
    {
        var cutoff = DateTime.UtcNow.AddHours(-12); // Active in last 12 hours
        var agents = await _context.Users
            .Where(u => u.Role == "Agent" && u.LastLatitude != null && u.LastLocationUpdateTime > cutoff)
            .Select(u => new ActiveAgentDto
            {
                AgentName = u.FullName,
                LastLatitude = u.LastLatitude,
                LastLongitude = u.LastLongitude,
                LastSeen = u.LastLocationUpdateTime
            })
            .ToListAsync(cancellationToken);

        return Result<List<ActiveAgentDto>>.Success(agents);
    }
}
