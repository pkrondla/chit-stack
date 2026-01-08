using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Forms.Queries.GetSubscriberAgreement;

public class GetSubscriberAgreementQuery : IRequest<Result<byte[]>>
{
    public int TicketId { get; set; }
}

public class GetSubscriberAgreementHandler : IRequestHandler<GetSubscriberAgreementQuery, Result<byte[]>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPdfService _pdfService;

    public GetSubscriberAgreementHandler(IApplicationDbContext context, IPdfService pdfService)
    {
        _context = context;
        _pdfService = pdfService;
    }

    public async Task<Result<byte[]>> Handle(GetSubscriberAgreementQuery request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets
            .Include(t => t.ChitGroup)
            .Include(t => t.Member)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId, cancellationToken);

        if (ticket == null) return Result<byte[]>.Failure("Ticket not found.");

        var pdfBytes = _pdfService.GenerateSubscriberAgreement(ticket.ChitGroup, ticket);
        return Result<byte[]>.Success(pdfBytes);
    }
}
