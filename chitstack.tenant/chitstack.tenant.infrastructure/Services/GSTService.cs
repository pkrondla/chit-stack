using ChitStack.Application.Common.Interfaces;

namespace ChitStack.Infrastructure.Tenant.Services;

public class GSTService : IGSTService
{
    public decimal CalculateGST(decimal amount, decimal ratePercent = 18.0m)
    {
        return amount * (ratePercent / 100);
    }

    public (decimal CGST, decimal SGST) CalculateSplitGST(decimal amount, decimal ratePercent = 18.0m)
    {
        var totalGst = CalculateGST(amount, ratePercent);
        var split = totalGst / 2;
        return (split, split);
    }
}
