using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Common;
using ChitLedger.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Application.Features.Users.Commands.UpdateUser;

public class UpdateUserCommand : IRequest<Result<int>>
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Password { get; set; } 
    public List<int> BranchIds { get; set; } = new();
}

public class UpdateUserHandler : IRequestHandler<UpdateUserCommand, Result<int>>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<int>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserBranches)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (user == null) return Result<int>.Failure("User not found.");

        user.Email = request.Email;
        user.FullName = request.FullName;
        user.Role = request.Role;

        if (!string.IsNullOrEmpty(request.Password))
        {
            user.PasswordHash = request.Password; 
        }

        // Update Branches
        user.UserBranches.Clear();
        if (request.BranchIds != null && request.BranchIds.Any())
        {
            foreach (var branchId in request.BranchIds)
            {
                user.UserBranches.Add(new UserBranch
                {
                    BranchId = branchId,
                    UserId = user.Id,
                    IsPrimary = user.UserBranches.Count == 0
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(user.Id);
    }
}
