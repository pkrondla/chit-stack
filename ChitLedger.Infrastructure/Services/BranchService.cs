using ChitLedger.Application.Common.Interfaces;

namespace ChitLedger.Infrastructure.Services;

public class BranchService : IBranchService
{
    private int? _branchId;

    public int? BranchId => _branchId;

    public void SetBranch(int branchId)
    {
        _branchId = branchId;
    }
}
