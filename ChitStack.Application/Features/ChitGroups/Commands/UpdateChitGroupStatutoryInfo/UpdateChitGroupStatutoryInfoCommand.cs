using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.ChitGroups.Commands.UpdateChitGroupStatutoryInfo;

/// <summary>
/// Updates the statutory/regulatory fields for a Chit Group:
/// sanction number, registration number, auction venue, security deposit info, and filing fees.
/// This can be updated at any stage of the group's lifecycle.
/// </summary>
public class UpdateChitGroupStatutoryInfoCommand : IRequest<Result<int>>
{
    public int Id { get; set; }
    public string? SanctionNumber { get; set; }
    public DateTime? SanctionDate { get; set; }
    public string? RegistrationNumber { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public string? AuctionVenueAddress { get; set; }
    public string? SecurityDepositBankName { get; set; }
    public string? SecurityDepositBankBranch { get; set; }
    public string? SecurityDepositFdrNumber { get; set; }
    public DateTime? SecurityDepositDate { get; set; }
    public decimal FilingFees { get; set; }
}

public class UpdateChitGroupStatutoryInfoHandler : IRequestHandler<UpdateChitGroupStatutoryInfoCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public UpdateChitGroupStatutoryInfoHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(UpdateChitGroupStatutoryInfoCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.ChitGroups.FirstOrDefaultAsync(g => g.Id == request.Id, cancellationToken);

        if (group == null)
            return Result<int>.Failure($"Group with ID {request.Id} not found.");

        group.SanctionNumber = request.SanctionNumber;
        group.SanctionDate = request.SanctionDate;
        group.RegistrationNumber = request.RegistrationNumber;
        group.RegistrationDate = request.RegistrationDate;
        group.AuctionVenueAddress = request.AuctionVenueAddress;
        group.SecurityDepositBankName = request.SecurityDepositBankName;
        group.SecurityDepositBankBranch = request.SecurityDepositBankBranch;
        group.SecurityDepositFdrNumber = request.SecurityDepositFdrNumber;
        group.SecurityDepositDate = request.SecurityDepositDate;
        group.FilingFees = request.FilingFees;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(group.Id);
    }
}
