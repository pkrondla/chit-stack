using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Nominees.Commands.UpdateNominee;

public class UpdateNomineeCommand : IRequest<Result<int>>
{
    public int TicketId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? AadhaarNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string? GuardianName { get; set; }
}

public class UpdateNomineeHandler : IRequestHandler<UpdateNomineeCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public UpdateNomineeHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(UpdateNomineeCommand request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets.FindAsync(new object[] { request.TicketId }, cancellationToken);
        if (ticket == null) return Result<int>.Failure("Ticket not found");

        var nominee = await _context.Nominees.FirstOrDefaultAsync(n => n.TicketId == request.TicketId, cancellationToken);
        
        if (nominee == null)
        {
            nominee = new Nominee { TicketId = request.TicketId };
            _context.Nominees.Add(nominee);
        }

        nominee.FullName = request.FullName;
        nominee.Relationship = request.Relationship;
        nominee.DateOfBirth = request.DateOfBirth;
        nominee.AadhaarNumber = request.AadhaarNumber;
        nominee.PhoneNumber = request.PhoneNumber;
        nominee.GuardianName = request.GuardianName;

        await _context.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(nominee.Id);
    }
}
