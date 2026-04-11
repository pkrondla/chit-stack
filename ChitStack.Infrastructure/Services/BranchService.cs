using ChitStack.Application.Common.Interfaces;

namespace ChitStack.Infrastructure.Services;

public class BranchService : IBranchService
{
    private int? _branchId;

    public int? BranchId => _branchId;

    public void SetBranch(int branchId)
    {
        _branchId = branchId;
    }
}
