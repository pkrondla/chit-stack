using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Common.Helpers;

public static class PenaltyCalculator
{
    public static (decimal EffectivePenalty, decimal TotalOutstanding, int OverdueDays) Calculate(Demand demand, ChitGroup group)
    {
        var today = DateTime.Today;
        
        // Unpaid principal is NetAmount minus whatever was collected AFTER paying the penalty already in DB
        decimal principalAlreadyPaid = Math.Max(0, demand.CollectedAmount - demand.PenaltyAmount);
        decimal livePenaltyBase = Math.Max(0, demand.NetAmount - principalAlreadyPaid);

        // Live Pro-Rata Penalty Calculation on the remaining principal balance
        int daysPastDue = (today - demand.DueDate).Days;
        decimal livePenalty = 0;
        int overdueDays = 0;
        
        if (daysPastDue > group.GracePeriodDays && livePenaltyBase > 0)
        {
            decimal monthlyRate = group.LateFeePercent;
            decimal dailyRate = (monthlyRate / 100m) / 30m;
            livePenalty = Math.Round(livePenaltyBase * dailyRate * daysPastDue, 2);
            overdueDays = daysPastDue;
        }

        // Use the higher of already recorded penalty or live penalty
        decimal effectivePenalty = Math.Max(demand.PenaltyAmount, livePenalty);
        
        // Final balance check: (NetAmount + Penalty) - CollectedAmount
        decimal totalOutstanding = (demand.NetAmount + effectivePenalty) - demand.CollectedAmount;
        
        return (effectivePenalty, Math.Max(0, totalOutstanding), overdueDays);
    }
}
