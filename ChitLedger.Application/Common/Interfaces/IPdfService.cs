using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Common.Interfaces;

public interface IPdfService
{
    byte[] GenerateSanctionForm(ChitGroup group);
    byte[] GenerateMinutesForm(Auction auction);
    byte[] GenerateDemandNotice(Demand demand, Member member, ChitGroup group);
    byte[] GenerateAgreementForm(ChitGroup group);
    byte[] GenerateBalanceSheet(List<AccountHead> accounts);
    byte[] GenerateReceipt(Receipt receipt, Member member, ChitGroup group);
}
