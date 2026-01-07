using AutoMapper;
using AutoMapper.QueryableExtensions;
using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Reporting.Queries.GetDayBook;

public class DayBookEntryDto
{
    public int JournalEntryId { get; set; }
    public DateTime EntryDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public string EntryType { get; set; } = string.Empty;
    public string ReferenceType { get; set; } = string.Empty;
    public int? ReferenceId { get; set; }
    public decimal TotalAmount { get; set; } // Sum of Debits
    
    public List<DayBookLineDto> Lines { get; set; } = new();

    private class Mapping : Profile
    {
        public Mapping()
        {
            CreateMap<JournalEntry, DayBookEntryDto>()
                .ForMember(d => d.TotalAmount, opt => opt.MapFrom(s => s.Lines.Sum(l => l.DebitAmount)));
        }
    }
}

public class DayBookLineDto
{
    public string AccountName { get; set; } = string.Empty;
    public string AccountCode { get; set; } = string.Empty;
    public decimal DebitAmount { get; set; }
    public decimal CreditAmount { get; set; }
    
    private class Mapping : Profile
    {
        public Mapping()
        {
            CreateMap<JournalEntryLine, DayBookLineDto>()
                .ForMember(d => d.AccountName, opt => opt.MapFrom(s => s.AccountHead.AccountName))
                .ForMember(d => d.AccountCode, opt => opt.MapFrom(s => s.AccountHead.AccountCode));
        }
    }
}

public class GetDayBookQuery : IRequest<Result<List<DayBookEntryDto>>>
{
    public DateTime Date { get; set; } = DateTime.Today; // Single day or range? Usually Day Book is single day.
    public DateTime? EndDate { get; set; } // Optional range
}

public class GetDayBookHandler : IRequestHandler<GetDayBookQuery, Result<List<DayBookEntryDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetDayBookHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<DayBookEntryDto>>> Handle(GetDayBookQuery request, CancellationToken cancellationToken)
    {
        var start = request.Date.Date;
        var end = request.EndDate?.Date.AddDays(1).AddTicks(-1) ?? start.AddDays(1).AddTicks(-1);

        var entries = await _context.JournalEntries
            .Include(j => j.Lines)
            .ThenInclude(l => l.AccountHead)
            .Where(j => j.EntryDate >= start && j.EntryDate <= end)
            .OrderBy(j => j.EntryDate)
            .ProjectTo<DayBookEntryDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        return Result<List<DayBookEntryDto>>.Success(entries);
    }
}
