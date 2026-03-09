using ChitLedger.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace ChitLedger.API.Middleware;

public class BranchMiddleware
{
    private readonly RequestDelegate _next;

    public BranchMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IBranchService branchService)
    {
        if (context.Request.Headers.TryGetValue("X-Branch-Id", out var branchIdValues))
        {
            var branchIdString = branchIdValues.FirstOrDefault();
            if (int.TryParse(branchIdString, out var branchId))
            {
                // In a real application, you might want to validate here if the CurrentUser 
                // is actually authorized for this branchId via UserBranches mapping.
                // For performance, this could be cached or checked via a claims token.
                branchService.SetBranch(branchId);
            }
        }

        await _next(context);
    }
}
