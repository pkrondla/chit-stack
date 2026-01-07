using ChitLedger.Domain.Entities;

namespace ChitLedger.Application.Common.Interfaces;

public interface IPdfService
{
    byte[] GenerateSanctionForm(ChitGroup group);
    // Add other forms later
}
