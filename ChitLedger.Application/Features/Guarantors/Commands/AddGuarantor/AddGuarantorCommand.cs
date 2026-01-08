using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Guarantors.Commands.AddGuarantor;

public class AddGuarantorCommand : IRequest<Result<int>>
{
    public int TicketId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string AadhaarNumber { get; set; } = string.Empty;
    public string Occupation { get; set; } = string.Empty;
    public decimal AnnualIncome { get; set; }
    public string Relationship { get; set; } = string.Empty;
}

public class AddGuarantorHandler : IRequestHandler<AddGuarantorCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public AddGuarantorHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(AddGuarantorCommand request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets.FindAsync(new object[] { request.TicketId }, cancellationToken);
        if (ticket == null) return Result<int>.Failure("Ticket not found.");

        var guarantor = new Guarantor
        {
            TicketId = request.TicketId,
            Name = request.Name,
            PhoneNumber = request.PhoneNumber,
            AadhaarNumber = request.AadhaarNumber,
            Occupation = request.Occupation,
            AnnualIncome = request.AnnualIncome,
            Relationship = request.Relationship
        };

        _context.Guarantors.Add(guarantor);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(guarantor.Id);
    }
}
