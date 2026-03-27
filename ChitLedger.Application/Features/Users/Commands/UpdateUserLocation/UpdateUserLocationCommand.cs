using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Users.Commands.UpdateUserLocation;

public class UpdateUserLocationCommand : IRequest<Result<int>>
{
    public int UserId { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
}

public class UpdateUserLocationHandler : IRequestHandler<UpdateUserLocationCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserLocationHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(UpdateUserLocationCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null) return Result<int>.Failure("User not found.");

        user.LastLatitude = request.Latitude;
        user.LastLongitude = request.Longitude;
        user.LastLocationUpdateTime = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(user.Id);
    }
}
