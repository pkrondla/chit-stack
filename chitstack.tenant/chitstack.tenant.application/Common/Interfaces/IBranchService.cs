namespace ChitStack.Application.Common.Interfaces;

public interface IBranchService
{
    int? BranchId { get; }
    void SetBranch(int branchId);
}
