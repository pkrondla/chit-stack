using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using ChitStack.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Collections.Commands.CloseRouteBatch;

public class CloseRouteBatchCommand : IRequest<Result<int>>
{
    public int AgentId { get; set; }
}

public class CloseRouteBatchHandler : IRequestHandler<CloseRouteBatchCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;
    private readonly IStaffNotificationService _staffNotification;

    public CloseRouteBatchHandler(IApplicationDbContext context, IStaffNotificationService staffNotification)
    {
        _context = context;
        _staffNotification = staffNotification;
    }

    public async Task<Result<int>> Handle(CloseRouteBatchCommand request, CancellationToken cancellationToken)
    {
        var pendingReceipts = await _context.Receipts
            .Where(r => r.AgentId == request.AgentId && r.Status == "Pending" && r.CollectionSubmissionId == null)
            .ToListAsync(cancellationToken);

        if (!pendingReceipts.Any())
        {
            return Result<int>.Failure("No pending collections found for this agent.");
        }

        var totalAmount = pendingReceipts.Sum(r => r.AmountReceived);
        var totalCash = pendingReceipts.Where(r => r.PaymentMode == "Cash").Sum(r => r.AmountReceived);
        var totalCheque = pendingReceipts.Where(r => r.PaymentMode == "Cheque").Sum(r => r.AmountReceived);

        var firstReceipt = pendingReceipts.First();

        var submission = new CollectionSubmission
        {
            AgentId = request.AgentId,
            SubmissionDate = DateTime.Now,
            TotalAmount = totalAmount,
            TotalCash = totalCash,
            TotalCheque = totalCheque,
            Status = "Pending",
            BranchId = firstReceipt.BranchId,
            TenantId = firstReceipt.TenantId
        };

        _context.CollectionSubmissions.Add(submission);
        await _context.SaveChangesAsync(cancellationToken);

        foreach (var receipt in pendingReceipts)
        {
            receipt.CollectionSubmissionId = submission.Id;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _staffNotification.Broadcast(
            "Route Batch Submitted",
            $"Agent #{request.AgentId} submitted batch #{submission.Id}: {pendingReceipts.Count} receipt(s) totalling ₹{totalAmount:N2} (Cash: ₹{totalCash:N2}, Cheque: ₹{totalCheque:N2}).");

        return Result<int>.Success(submission.Id);
    }
}
