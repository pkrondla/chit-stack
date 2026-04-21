using System.Text;
using ChitStack.Application.Common.Constants;
using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Finance.Queries.GetGstr1Report;

public class GetGstr1ReportQuery : IRequest<Result<byte[]>>
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int? BranchId { get; set; }
}

public class GetGstr1ReportHandler : IRequestHandler<GetGstr1ReportQuery, Result<byte[]>>
{
    private readonly IApplicationDbContext _context;

    public GetGstr1ReportHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<byte[]>> Handle(GetGstr1ReportQuery request, CancellationToken cancellationToken)
    {
        var toDate = request.ToDate.Date.AddDays(1);
        var query = _context.JournalEntries
            .Include(j => j.Lines)
            .ThenInclude(l => l.AccountHead)
            .Where(j => j.EntryDate >= request.FromDate.Date && j.EntryDate < toDate);

        if (request.BranchId.HasValue)
        {
            query = query.Where(j => j.BranchId == request.BranchId);
        }

        var incomeEntries = await query
            .Where(j => j.EntryType == "Auction-Close" || j.Description.Contains("Commission") 
                     || j.Lines.Any(l => l.AccountHead.SystemRole == AccountRoles.CgstLiability 
                                     || l.AccountHead.SystemRole == AccountRoles.SgstLiability 
                                     || l.AccountHead.SystemRole == AccountRoles.GstLiability))
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        // GSTIN/UIN of Recipient,Receiver Name,Invoice Number,Invoice Date,Invoice Value,Place Of Supply,Rate,Taxable Value,Integrated Tax,Central Tax,State/UT Tax,Cess
        sb.AppendLine("GSTIN/UIN of Recipient,Receiver Name,Invoice Number,Invoice Date,Invoice Value,Place Of Supply,Rate,Taxable Value,Integrated Tax,Central Tax,State/UT Tax,Cess");

        foreach (var entry in incomeEntries)
        {
            var commissionLine = entry.Lines.FirstOrDefault(l => l.AccountHead.SystemRole == AccountRoles.CommissionIncome && l.CreditAmount > 0);
            var cgstLine = entry.Lines.FirstOrDefault(l => (l.AccountHead.SystemRole == AccountRoles.CgstLiability || l.AccountHead.SystemRole == AccountRoles.GstLiability) && l.CreditAmount > 0);
            var sgstLine = entry.Lines.FirstOrDefault(l => l.AccountHead.SystemRole == AccountRoles.SgstLiability && l.CreditAmount > 0);

            var taxableValue = commissionLine?.CreditAmount ?? 0;
            if (taxableValue == 0) continue;

            var centralTax = cgstLine?.CreditAmount ?? 0;
            var stateTax = sgstLine?.CreditAmount ?? 0;
            var invoiceValue = taxableValue + centralTax + stateTax;
            
            var invoiceNo = $"INV-{entry.Id}";
            var invoiceDate = entry.EntryDate.ToString("dd-MMM-yyyy");
          
            sb.AppendLine($",Subscriber,{invoiceNo},{invoiceDate},{invoiceValue:F2},33-TN,18.0,{taxableValue:F2},0,{centralTax:F2},{stateTax:F2},0");
        }

        return Result<byte[]>.Success(Encoding.UTF8.GetBytes(sb.ToString()));
    }
}
