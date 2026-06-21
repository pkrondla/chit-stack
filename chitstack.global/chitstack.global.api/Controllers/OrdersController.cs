using ChitStack.Application.Features.Orders.Commands.CompleteProvisioning;
using ChitStack.Application.Features.Orders.Commands.ConfirmPayment;
using ChitStack.Application.Features.Orders.Commands.RecordPayment;
using ChitStack.Application.Features.Orders.Commands.SetOrderStatus;
using ChitStack.Application.Features.Orders.Commands.SubmitOrder;
using ChitStack.Application.Features.Orders.Queries.GetMyOrder;
using ChitStack.Application.Features.Orders.Queries.GetOrder;
using ChitStack.Application.Features.Orders.Queries.GetOrders;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChitStack.Global.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Public — submit subscription order form.</summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<Result<SubmitOrderResponse>>> Submit(SubmitOrderCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Public — fetch the subscriber's latest order by their contact email.</summary>
    [HttpGet("my-order")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<OrderDetailDto?>>> GetMyOrder([FromQuery] string email)
    {
        var result = await _mediator.Send(new GetMyOrderQuery { ContactEmail = email });
        return Ok(result);
    }

    /// <summary>Public — fetch order by reference (ref acts as a secret).</summary>
    [HttpGet("{orderRef}")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<OrderDetailDto>>> Get(string orderRef)
    {
        var result = await _mediator.Send(new GetOrderQuery { OrderReference = orderRef });
        if (!result.Succeeded) return NotFound(result);
        return Ok(result);
    }

    /// <summary>Public — user records payment transaction details.</summary>
    [HttpPatch("{orderRef}/payment")]
    [AllowAnonymous]
    public async Task<ActionResult<Result<bool>>> RecordPayment(
        string orderRef,
        RecordPaymentCommand command)
    {
        command.OrderReference = orderRef;
        command.UpdatedByRole = "User";
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    // ── Admin endpoints ────────────────────────────────────────────────────────

    /// <summary>Admin — list all orders, optionally filtered by status.</summary>
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<List<OrderSummaryDto>>>> GetAll(
        [FromQuery] string? status)
    {
        return Ok(await _mediator.Send(new GetOrdersQuery { StatusFilter = status }));
    }

    /// <summary>Admin — full order detail.</summary>
    [HttpGet("admin/{orderRef}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<OrderDetailDto>>> GetAdmin(string orderRef)
    {
        var result = await _mediator.Send(new GetOrderQuery { OrderReference = orderRef });
        if (!result.Succeeded) return NotFound(result);
        return Ok(result);
    }

    /// <summary>Admin — record or update payment transaction.</summary>
    [HttpPatch("admin/{orderRef}/payment")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<bool>>> AdminRecordPayment(
        string orderRef,
        RecordPaymentCommand command)
    {
        command.OrderReference = orderRef;
        command.UpdatedByRole = "Admin";
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Admin — confirm payment.</summary>
    [HttpPost("admin/{orderRef}/confirm-payment")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<bool>>> ConfirmPayment(
        string orderRef,
        ConfirmPaymentCommand command)
    {
        command.OrderReference = orderRef;
        command.IsRejection = false;
        command.ConfirmedBy = User.Identity?.Name ?? "Admin";
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Admin — reject payment with reason.</summary>
    [HttpPost("admin/{orderRef}/reject-payment")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<bool>>> RejectPayment(
        string orderRef,
        ConfirmPaymentCommand command)
    {
        command.OrderReference = orderRef;
        command.IsRejection = true;
        command.ConfirmedBy = User.Identity?.Name ?? "Admin";
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Admin — mark order as Provisioning (before running the workflow).</summary>
    [HttpPost("admin/{orderRef}/provision")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<bool>>> StartProvisioning(string orderRef)
    {
        var result = await _mediator.Send(new SetOrderStatusCommand
        {
            OrderReference = orderRef,
            Status = "Provisioning"
        });
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>Admin — complete provisioning, store connection string, send welcome email.</summary>
    [HttpPost("admin/{orderRef}/complete")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Result<bool>>> CompleteProvisioning(
        string orderRef,
        CompleteProvisioningCommand command)
    {
        command.OrderReference = orderRef;
        command.CompletedBy = User.Identity?.Name ?? "Admin";
        var result = await _mediator.Send(command);
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
