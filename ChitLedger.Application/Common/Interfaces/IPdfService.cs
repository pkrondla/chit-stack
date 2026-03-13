using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Common.Interfaces;

public interface IPdfService
{
    // Statutory forms (Tamil Nadu Chit Funds Act)
    byte[] GenerateSanctionForm(ChitGroup group, TenantSettings? settings = null);          // Form I  (Sec 4)
    byte[] GenerateAgreementForm(ChitGroup group, TenantSettings? settings = null);         // Form II (Sec 8) - Registration filing
    byte[] GenerateByeLaws(ChitGroup group, TenantSettings? settings = null);               // Bye-laws of the Chit
    byte[] GenerateSecurityDepositLetter(ChitGroup group, TenantSettings? settings = null); // Security Deposit request / proof letter
    byte[] GenerateFormV(ChitGroup group, TenantSettings? settings = null);                 // Form V  (Sec 9(1)) - Declaration of full subscription
    byte[] GenerateFormVI(ChitGroup group, TenantSettings? settings = null);                // Form VI (Sec 10)  - Certificate of commencement (request)
    byte[] GenerateFormVII(ChitGroup group, TenantSettings? settings = null);               // Form VII (Sec 11) - Agreements handed to subscribers

    // Operational forms
    byte[] GenerateSubscriberAgreement(ChitGroup group, Ticket ticket, TenantSettings? settings = null);
    byte[] GenerateMinutesForm(Auction auction, TenantSettings? settings = null);
    byte[] GenerateDemandNotice(Demand demand, Member member, ChitGroup group, TenantSettings? settings = null);
    byte[] GenerateBalanceSheet(List<AccountHead> accounts, TenantSettings? settings = null);
    byte[] GenerateReceipt(Receipt receipt, Member member, ChitGroup group, TenantSettings? settings = null);
    byte[] GenerateKycForm(Member member, TenantSettings? settings = null);
}

