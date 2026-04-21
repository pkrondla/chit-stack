using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Application.Features.GlobalUsers.Queries.GetGlobalUsers;

public class GlobalUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class GetGlobalUsersQuery : IRequest<Result<List<GlobalUserDto>>>
{
}

public class GetGlobalUsersHandler : IRequestHandler<GetGlobalUsersQuery, Result<List<GlobalUserDto>>>
{
    private readonly IGlobalDbContext _context;

    public GetGlobalUsersHandler(IGlobalDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<GlobalUserDto>>> Handle(GetGlobalUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .Select(u => new GlobalUserDto
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                IsActive = u.IsActive
            })
            .ToListAsync(cancellationToken);

        return Result<List<GlobalUserDto>>.Success(users);
    }
}
