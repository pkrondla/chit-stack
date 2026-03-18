using ChitLedger.Application.Common.Constants;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Finance.Queries.GetGstr1Report;

public class Gstr1EntryDto
{
    public string ReceiverName { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public decimal InvoiceValue { get; set; }
    public string PlaceOfSupply { get; set; } = "33-TN";
    public decimal Rate { get; set; } = 18.0m;
    public decimal TaxableValue { get; set; }
    public decimal CentralTax { get; set; }
    public decimal StateTax { get; set; }
}

public class GetGstr1DataQuery : IRequest<Result<List<Gstr1EntryDto>>>
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
}

public class GetGstr1DataHandler : IRequestHandler<GetGstr1DataQuery, Result<List<Gstr1EntryDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetGstr1DataHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<Gstr1EntryDto>>> Handle(GetGstr1DataQuery request, CancellationToken cancellationToken)
    {
        var incomeEntries = await _context.JournalEntries
            .Include(j => j.Lines)
            .ThenInclude(l => l.AccountHead)
            .Where(j => j.EntryDate >= request.FromDate && j.EntryDate <= request.ToDate 
                     && (j.EntryType == "Auction-Close" || j.Description.Contains("Commission")))
            .ToListAsync(cancellationToken);

        var result = incomeEntries.Select(entry => 
        {
            var commissionLine = entry.Lines.FirstOrDefault(l => l.AccountHead.SystemRole == AccountRoles.CommissionIncome && l.CreditAmount > 0);
            var cgstLine = entry.Lines.FirstOrDefault(l => (l.AccountHead.SystemRole == AccountRoles.CgstLiability || l.AccountHead.SystemRole == AccountRoles.GstLiability) && l.CreditAmount > 0);
            var sgstLine = entry.Lines.FirstOrDefault(l => l.AccountHead.SystemRole == AccountRoles.SgstLiability && l.CreditAmount > 0);

            var taxableValue = commissionLine?.CreditAmount ?? 0;
            var centralTax = cgstLine?.CreditAmount ?? (taxableValue * 0.09m);
            var stateTax = sgstLine?.CreditAmount ?? (taxableValue * 0.09m);

            if (taxableValue == 0) return null;

            return new Gstr1EntryDto
            {
                ReceiverName = "Subscriber",
                InvoiceNumber = $"INV-{entry.Id}",
                InvoiceDate = entry.EntryDate,
                InvoiceValue = taxableValue + centralTax + stateTax,
                TaxableValue = taxableValue,
                CentralTax = centralTax,
                StateTax = stateTax
            };
        })
        .Where(x => x != null)
        .Select(x => x!)
        .ToList();

        return Result<List<Gstr1EntryDto>>.Success(result);
    }
}
