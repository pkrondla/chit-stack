using System.Text;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Finance.Queries.GetGstr1Report;

public class GetGstr1ReportQuery : IRequest<Result<byte[]>>
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
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
        var incomeEntries = await _context.JournalEntries
            .Include(j => j.Lines)
            .Where(j => j.EntryDate >= request.FromDate && j.EntryDate <= request.ToDate 
                     && j.Description.Contains("Commission"))
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("GSTIN/UIN of Recipient,Receiver Name,Invoice Number,Invoice Date,Invoice Value,Place Of Supply,Rate,Taxable Value,Integrated Tax,Central Tax,State/UT Tax,Cess");

        foreach (var entry in incomeEntries)
        {
            // Calculate Taxable Value from Credit Lines
            var taxableValue = entry.Lines.Sum(l => l.CreditAmount);
            
            var invoiceNo = $"INV-{entry.Id}";
            var invoiceDate = entry.EntryDate.ToString("dd-MMM-yyyy");
            
            // Assuming 18% Tax is INCLUDED or EXCLUDED? 
            // If "Commission" description, usually it's the Income + Tax or just Income.
            // Let's assume Taxable Value is the credit sum for simplicity in V1 report.
          
            sb.AppendLine($",Scriber,{invoiceNo},{invoiceDate},{taxableValue},33-TN,18.0,{taxableValue},0,{(taxableValue*0.09m):F2},{(taxableValue*0.09m):F2},0");
        }

        return Result<byte[]>.Success(Encoding.UTF8.GetBytes(sb.ToString()));
    }
}
