using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.Orders.Commands.SetOrderStatus;

public class SetOrderStatusCommand : IRequest<Result<bool>>
{
    public string OrderReference { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class SetOrderStatusHandler : IRequestHandler<SetOrderStatusCommand, Result<bool>>
{
    private readonly IGlobalDbContext _context;

    public SetOrderStatusHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(
        SetOrderStatusCommand request,
        CancellationToken cancellationToken)
    {
        var order = await _context.TenantOrders
            .FirstOrDefaultAsync(o => o.OrderReference == request.OrderReference, cancellationToken);

        if (order is null)
            return Result<bool>.Failure("Order not found.");

        order.OrderStatus = request.Status;
        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
