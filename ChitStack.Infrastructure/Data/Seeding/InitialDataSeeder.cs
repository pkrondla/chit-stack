using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Infrastructure.Data.Seeding;

public class InitialDataSeeder
{
    private readonly TenantDbContext _context;

    public InitialDataSeeder(TenantDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        // 1. Ensure Tenant exists
        if (!await _context.Tenants.AnyAsync())
        {
            var tenant = new Tenant
            {
                TenantKey = "default",
                Name = "Default Tenant",
                SubscriptionStatus = "Active"
            };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();
        }

        var defaultTenant = await _context.Tenants.FirstAsync();
        var tenantId = defaultTenant.Id;

        // 2. Ensure Branch exists
        if (!await _context.Branches.AnyAsync())
        {
            var branch = new Branch
            {
                TenantId = tenantId,
                Code = "HQ",
                Name = "Headquarters",
                Address = "123 Main St",
                ContactNumber = "555-0100"
            };
            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();
        }

        var hqBranch = await _context.Branches.FirstAsync();

        // 3. Ensure Admin User exists
        if (!await _context.Users.AnyAsync(u => u.Username == "admin"))
        {
            var admin = new User
            {
                Username = "admin",
                PasswordHash = "admin123",
                Email = "admin@example.com",
                FullName = "Admin User",
                Role = "Admin",
                TenantId = tenantId
            };
            _context.Users.Add(admin);
            await _context.SaveChangesAsync();

            var userBranch = new UserBranch
            {
                TenantId = tenantId,
                UserId = admin.Id,
                BranchId = hqBranch.Id,
                IsPrimary = true
            };
            _context.UserBranches.Add(userBranch);
            await _context.SaveChangesAsync();
        }

        // 4. Ensure a Subscriber exists for OTP testing
        const string testMobile = "9999999999";
        if (!await _context.Users.AnyAsync(u => u.Username == testMobile))
        {
             var existingMember = await _context.Members.FirstOrDefaultAsync(m => m.PhoneNumber == testMobile);
             if (existingMember == null)
             {
                 existingMember = new Member
                 {
                     FullName = "Demo Subscriber",
                     PhoneNumber = testMobile,
                     Email = "subscriber@example.com",
                     AadhaarNumber = "123412341234",
                     RegistrationBranchId = hqBranch.Id,
                     TenantId = tenantId
                 };
                 _context.Members.Add(existingMember);
                 await _context.SaveChangesAsync();
             }

             var subUser = new User
             {
                 Username = testMobile,
                 PasswordHash = "Member@123",
                 Email = "subscriber@example.com",
                 FullName = "Demo Subscriber",
                 Role = "Subscriber",
                 MemberId = existingMember.Id,
                 TenantId = tenantId
             };
             _context.Users.Add(subUser);
             await _context.SaveChangesAsync();
        }

        // 5. Ensure TenantSettings exist
        if (!await _context.TenantSettings.AnyAsync())
        {
            var settings = new TenantSettings
            {
                TenantId = tenantId,
                CompanyName = "ChitStack Demo",
                RegistrationNumber = "DEMO-12345",
                RegisteredOfficeAddress = "123 Demo Street, Cloud City",
                ForemanName = "System",
                NotifyOnReceipt = true,
                NotifyOnAuctionWon = true,
                NotifyOnDemand = true,
                AutoPaymentRemindersEnabled = true,
                PaymentReminderDaysBefore = 3
            };
            _context.TenantSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        // 6. Ensure default NotificationTemplates exist
        if (!await _context.NotificationTemplates.AnyAsync())
        {
            var templates = new List<NotificationTemplate>
            {
                new NotificationTemplate
                {
                    TenantId = tenantId,
                    Name = "ReceiptConfirmation",
                    TitleTemplate = "Payment Received: {Amount}",
                    MessageTemplate = "Dear {MemberName}, we have received your payment of {Amount} for {ChitGroup}. Your current balance is {Balance}. Receipt No: {ReceiptNo}.",
                    IsEnabled = true
                },
                new NotificationTemplate
                {
                    TenantId = tenantId,
                    Name = "AuctionWinner",
                    TitleTemplate = "Congratulations! You won the Auction",
                    MessageTemplate = "Dear {MemberName}, you have successfully won the auction for {ChitGroup} (Inst {InstallmentNo}) with a bid of {BidAmount}.",
                    IsEnabled = true
                },
                new NotificationTemplate
                {
                    TenantId = tenantId,
                    Name = "DemandAlert",
                    TitleTemplate = "Installment Due: {ChitGroup}",
                    MessageTemplate = "Dear {MemberName}, installment of {Amount} for {ChitGroup} is due on {DueDate}. Please pay to avoid penalties.",
                    IsEnabled = true
                }
            };
            _context.NotificationTemplates.AddRange(templates);
            await _context.SaveChangesAsync();
        }

        // 7. Ensure Account Hierarchy exists (The 5 Pillars of Accounting)
        var rootsToEnsure = new List<AccountHead>
        {
            new AccountHead { AccountName = "Assets", AccountCode = "1000", Type = AccountType.Asset, IsGroup = true, IsSystem = true, TenantId = tenantId },
            new AccountHead { AccountName = "Liabilities", AccountCode = "2000", Type = AccountType.Liability, IsGroup = true, IsSystem = true, TenantId = tenantId },
            new AccountHead { AccountName = "Equity", AccountCode = "3000", Type = AccountType.Liability, IsGroup = true, IsSystem = true, TenantId = tenantId },
            new AccountHead { AccountName = "Income", AccountCode = "4000", Type = AccountType.Income, IsGroup = true, IsSystem = true, TenantId = tenantId },
            new AccountHead { AccountName = "Expenses", AccountCode = "5000", Type = AccountType.Expense, IsGroup = true, IsSystem = true, TenantId = tenantId }
        };

        foreach (var root in rootsToEnsure)
        {
            if (!await _context.AccountHeads.AnyAsync(a => a.AccountName == root.AccountName && a.ParentId == null))
            {
                Console.WriteLine($"[SEED] Seeding root account: {root.AccountName}");
                _context.AccountHeads.Add(root);
                await _context.SaveChangesAsync();
            }
        }

        var assetRoot = await _context.AccountHeads.FirstAsync(a => a.AccountName == "Assets" && a.ParentId == null);
        var liabRoot = await _context.AccountHeads.FirstAsync(a => a.AccountName == "Liabilities" && a.ParentId == null);
        var equityRoot = await _context.AccountHeads.FirstAsync(a => a.AccountName == "Equity" && a.ParentId == null);
        var incRoot = await _context.AccountHeads.FirstAsync(a => a.AccountName == "Income" && a.ParentId == null);
        var expRoot = await _context.AccountHeads.FirstAsync(a => a.AccountName == "Expenses" && a.ParentId == null);

        // Sub-groups
        var subGroupsToEnsure = new List<(string Name, string Code, AccountType Type, int ParentId)>
        {
             ("Fixed Assets", "1100", AccountType.Asset, assetRoot.Id),
             ("Bank Accounts", "1200", AccountType.Asset, assetRoot.Id),
             ("Current Assets", "1300", AccountType.Asset, assetRoot.Id),
             ("Current Liabilities", "2100", AccountType.Liability, liabRoot.Id),
             ("Member Payables", "2200", AccountType.Liability, liabRoot.Id),
             ("Capital Accounts", "3100", AccountType.Liability, equityRoot.Id),
             ("Reserves & Surplus", "3200", AccountType.Liability, equityRoot.Id),
             ("Direct Income (Chit)", "4100", AccountType.Income, incRoot.Id),
             ("Indirect Income", "4200", AccountType.Income, incRoot.Id),
             ("Direct Expenses", "5100", AccountType.Expense, expRoot.Id),
             ("Administrative Expenses", "5200", AccountType.Expense, expRoot.Id)
        };

        foreach (var sg in subGroupsToEnsure)
        {
            if (!await _context.AccountHeads.AnyAsync(a => a.AccountName == sg.Name && a.ParentId == sg.ParentId))
            {
                _context.AccountHeads.Add(new AccountHead 
                { 
                    AccountName = sg.Name, 
                    AccountCode = sg.Code, 
                    Type = sg.Type, 
                    IsGroup = true, 
                    ParentId = sg.ParentId, 
                    TenantId = tenantId 
                });
                await _context.SaveChangesAsync();
            }
        }

        // 7b. Posting Accounts
        var bankGrp = await _context.AccountHeads.FirstAsync(g => g.AccountName == "Bank Accounts" && g.ParentId == assetRoot.Id);
        var curAssetGrp = await _context.AccountHeads.FirstAsync(g => g.AccountName == "Current Assets" && g.ParentId == assetRoot.Id);
        var memPayGrp = await _context.AccountHeads.FirstAsync(g => g.AccountName == "Member Payables" && g.ParentId == liabRoot.Id);
        var resGrp = await _context.AccountHeads.FirstAsync(g => g.AccountName == "Reserves & Surplus" && g.ParentId == equityRoot.Id);
        var capGrp = await _context.AccountHeads.FirstAsync(g => g.AccountName == "Capital Accounts" && g.ParentId == equityRoot.Id);
        var dirIncGrp = await _context.AccountHeads.FirstAsync(g => g.AccountName == "Direct Income (Chit)" && g.ParentId == incRoot.Id);

        var postingAccounts = new List<(string Name, string Code, AccountType Type, int ParentId, string? Role)>
        {
            ("Main Bank Account", "1201", AccountType.Asset, bankGrp.Id, null),
            ("Cash in Hand", "1301", AccountType.Asset, curAssetGrp.Id, null),
            ("Member Receivables", "1302", AccountType.Asset, curAssetGrp.Id, "MemberReceivable"),
            ("Prize Money Payable", "2201", AccountType.Liability, memPayGrp.Id, "PrizePayable"),
            ("Dividend Payable", "2202", AccountType.Liability, memPayGrp.Id, null),
            ("Owner Capital Account", "3101", AccountType.Liability, capGrp.Id, null),
            ("Retained Earnings", "3201", AccountType.Liability, resGrp.Id, "RetainedEarnings"),
            ("Foreman Commission", "4101", AccountType.Income, dirIncGrp.Id, "CommissionIncome")
        };

        foreach (var pa in postingAccounts)
        {
            if (!await _context.AccountHeads.AnyAsync(a => a.AccountName == pa.Name && a.ParentId == pa.ParentId))
            {
                _context.AccountHeads.Add(new AccountHead 
                { 
                    AccountName = pa.Name, 
                    AccountCode = pa.Code, 
                    Type = pa.Type, 
                    ParentId = pa.ParentId, 
                    SystemRole = pa.Role,
                    TenantId = tenantId 
                });
                await _context.SaveChangesAsync();
            }
        }

        // 8. Find and Organize existing unmapped accounts into the hierarchy
        var unmappedAccounts = await _context.AccountHeads
            .Where(a => a.ParentId == null && !a.IsSystem && !a.IsGroup)
            .ToListAsync();

        if (unmappedAccounts.Any())
        {
            var adminExpGroup = await _context.AccountHeads.FirstOrDefaultAsync(a => a.AccountName == "Administrative Expenses");
            var bankAccountsGroup = await _context.AccountHeads.FirstOrDefaultAsync(a => a.AccountName == "Bank Accounts");
            var currentAssetsGroup = await _context.AccountHeads.FirstOrDefaultAsync(a => a.AccountName == "Current Assets");

            foreach (var acc in unmappedAccounts)
            {
                var name = acc.AccountName.ToLower();
                if (name.Contains("bank") && name.Contains("charge"))
                {
                    if (adminExpGroup != null) acc.ParentId = adminExpGroup.Id;
                }
                else if (name.Contains("bank") || name.Contains("hdfc") || name.Contains("icici") || name.Contains("sbi") || name.Contains("equitas"))
                {
                    if (bankAccountsGroup != null) acc.ParentId = bankAccountsGroup.Id;
                }
                else if (name.Contains("cash") || name.Contains("receivable"))
                {
                    if (currentAssetsGroup != null) acc.ParentId = currentAssetsGroup.Id;
                }
                else if (name.Contains("rent") || name.Contains("electricity") || name.Contains("salary"))
                {
                    if (adminExpGroup != null) acc.ParentId = adminExpGroup.Id;
                }
            }
            await _context.SaveChangesAsync();
        }

        // 9. Retroactive Backfill for Sub-ledger Tags
        var linesToBackfill = await _context.JournalEntryLines
            .Include(l => l.JournalEntry)
            .Where(l => l.MemberId == null && l.ChitGroupId == null && l.JournalEntry.ReferenceId != null)
            .ToListAsync();

        if (linesToBackfill.Any())
        {
            Console.WriteLine($"[SEED] Backfilling {linesToBackfill.Count} journal lines with sub-ledger tags...");
            foreach (var line in linesToBackfill)
            {
                if (line.JournalEntry.ReferenceType == "Auction")
                {
                    var auction = await _context.Auctions.FindAsync(line.JournalEntry.ReferenceId);
                    if (auction != null)
                    {
                        line.ChitGroupId = auction.ChitGroupId;
                        line.AuctionId = auction.Id;
                        
                        var account = await _context.AccountHeads.FindAsync(line.AccountHeadId);
                        if (account != null && account.SystemRole == "PrizePayable")
                        {
                            var winningTicket = await _context.Tickets.FindAsync(auction.WinningTicketId);
                            line.MemberId = winningTicket?.MemberId;
                            line.TicketId = winningTicket?.Id;
                        }
                    }
                }
                else if (line.JournalEntry.ReferenceType == "Receipt")
                {
                    var receipt = await _context.Receipts.Include(r => r.Ticket).FirstOrDefaultAsync(r => r.Id == line.JournalEntry.ReferenceId);
                    if (receipt != null)
                    {
                        line.MemberId = receipt.Ticket?.MemberId;
                        line.ChitGroupId = receipt.Ticket?.ChitGroupId;
                        line.TicketId = receipt.TicketId;
                        line.AuctionId = receipt.AuctionId;
                    }
                }
            }
            await _context.SaveChangesAsync();
        }
    }
}
