namespace ChitStack.Application.Common.Interfaces;

public interface IGSTService
{
    decimal CalculateGST(decimal amount, decimal ratePercent = 18.0m);
    (decimal CGST, decimal SGST) CalculateSplitGST(decimal amount, decimal ratePercent = 18.0m);
}
