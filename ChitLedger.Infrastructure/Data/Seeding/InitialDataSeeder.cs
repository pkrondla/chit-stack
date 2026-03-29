using ChitLedger.Application.Common.Interfaces;
using ChitLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChitLedger.Infrastructure.Data.Seeding;

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
                PasswordHash = "admin123", // Using plain text for now as per project existing pattern (TODO: Hash)
                Email = "admin@example.com",
                FullName = "Admin User",
                Role = "Admin",
                TenantId = tenantId
            };
            _context.Users.Add(admin);
            await _context.SaveChangesAsync();

            // Link Admin to Branch
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
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == testMobile);
        if (existingUser == null)
        {
             Console.WriteLine($"[SEED] Creating demo subscriber {testMobile}...");
             
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
             Console.WriteLine($"[SEED] Demo subscriber created successfully.");
        }
        else 
        {
             Console.WriteLine($"[SEED] Demo subscriber {testMobile} already exists.");
        }

        // 5. Ensure TenantSettings exist
        if (!await _context.TenantSettings.AnyAsync())
        {
            Console.WriteLine("[SEED] Seeding default TenantSettings...");
            var settings = new TenantSettings
            {
                TenantId = tenantId,
                CompanyName = "ChitLedger Demo",
                RegistrationNumber = "DEMO-12345",
                RegisteredOfficeAddress = "123 Demo Street, Cloud City",
                ForemanName = "System",
                NotifyOnReceipt = true,
                NotifyOnAuctionWon = true,
                NotifyOnDemand = true,
                AutoPaymentRemindersEnabled = true, // Enable for demo
                PaymentReminderDaysBefore = 3
            };
            _context.TenantSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        // 6. Ensure default NotificationTemplates exist
        if (!await _context.NotificationTemplates.AnyAsync())
        {
            Console.WriteLine("[SEED] Seeding default NotificationTemplates...");
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
                    MessageTemplate = "Dear {MemberName}, is installment of {Amount} for {ChitGroup} is due on {DueDate}. Please pay to avoid penalties.",
                    IsEnabled = true
                }
            };
            _context.NotificationTemplates.AddRange(templates);
            await _context.SaveChangesAsync();
        }

        // 7. Ensure Account Hierarchy exists
        var assetRoot = await _context.AccountHeads.FirstOrDefaultAsync(a => a.AccountName == "Assets" && a.ParentId == null);
        if (assetRoot == null)
        {
            Console.WriteLine("[SEED] Seeding Account Hierarchy...");
            
            // Create Root Groups
            var roots = new List<AccountHead>
            {
                new AccountHead { AccountName = "Assets", AccountCode = "1000", Type = AccountType.Asset, IsGroup = true, IsSystem = true, TenantId = tenantId },
                new AccountHead { AccountName = "Liabilities", AccountCode = "2000", Type = AccountType.Liability, IsGroup = true, IsSystem = true, TenantId = tenantId },
                new AccountHead { AccountName = "Income", AccountCode = "3000", Type = AccountType.Income, IsGroup = true, IsSystem = true, TenantId = tenantId },
                new AccountHead { AccountName = "Expenses", AccountCode = "4000", Type = AccountType.Expense, IsGroup = true, IsSystem = true, TenantId = tenantId }
            };
            
            _context.AccountHeads.AddRange(roots);
            await _context.SaveChangesAsync();
            
            assetRoot = roots.First(g => g.AccountName == "Assets");
            var liabRoot = roots.First(g => g.AccountName == "Liabilities");
            var incRoot = roots.First(g => g.AccountName == "Income");
            var expRoot = roots.First(g => g.AccountName == "Expenses");

            // Sub-groups
            var subGroups = new List<AccountHead>
            {
                 new AccountHead { AccountName = "Current Assets", AccountCode = "1100", Type = AccountType.Asset, IsGroup = true, ParentId = assetRoot.Id, TenantId = tenantId },
                 new AccountHead { AccountName = "Bank Accounts", AccountCode = "1110", Type = AccountType.Asset, IsGroup = true, ParentId = assetRoot.Id, TenantId = tenantId },
                 new AccountHead { AccountName = "Current Liabilities", AccountCode = "2100", Type = AccountType.Liability, IsGroup = true, ParentId = liabRoot.Id, TenantId = tenantId },
                 new AccountHead { AccountName = "Direct Income", AccountCode = "3100", Type = AccountType.Income, IsGroup = true, ParentId = incRoot.Id, TenantId = tenantId },
                 new AccountHead { AccountName = "Administrative Expenses", AccountCode = "4100", Type = AccountType.Expense, IsGroup = true, ParentId = expRoot.Id, TenantId = tenantId }
            };
            _context.AccountHeads.AddRange(subGroups);
            await _context.SaveChangesAsync();
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

            bool modified = false;
            foreach (var acc in unmappedAccounts)
            {
                var name = acc.AccountName.ToLower();

                // Bank CHARGES is an expense, ICICI Bank is an asset
                if (name.Contains("bank") && name.Contains("charge"))
                {
                    if (adminExpGroup != null) { acc.ParentId = adminExpGroup.Id; modified = true; }
                }
                else if (name.Contains("bank") || name.Contains("hdfc") || name.Contains("icici") || name.Contains("sbi") || name.Contains("equitas"))
                {
                    if (bankAccountsGroup != null) { acc.ParentId = bankAccountsGroup.Id; modified = true; }
                }
                else if (name.Contains("cash") || name.Contains("receivable"))
                {
                    if (currentAssetsGroup != null) { acc.ParentId = currentAssetsGroup.Id; modified = true; }
                }
                else if (name.Contains("rent") || name.Contains("electricity") || name.Contains("salary"))
                {
                    if (adminExpGroup != null) { acc.ParentId = adminExpGroup.Id; modified = true; }
                }
            }
            if (modified) await _context.SaveChangesAsync();
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
            Console.WriteLine("[SEED] Sub-ledger tagging backfill complete.");
        }
    }
}
