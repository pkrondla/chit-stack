using ChitStack.Application.Common.Interfaces;
using ChitStack.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChitStack.Infrastructure.Tenant.Data.Seeding;

public class InitialDataSeeder
{
    private readonly ChitStack.Infrastructure.Data.TenantDbContext _context;

    public InitialDataSeeder(ChitStack.Infrastructure.Data.TenantDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        if (!await _context.Tenants.AnyAsync())
        {
            var tenant = new ChitStack.Domain.Entities.Tenant
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

        if (!await _context.NotificationTemplates.AnyAsync())
        {
            var templates = new List<NotificationTemplate>
            {
                new()
                {
                    TenantId = tenantId,
                    Name = "ReceiptConfirmation",
                    TitleTemplate = "Payment Received: {Amount}",
                    MessageTemplate = "Dear {MemberName}, we have received your payment of {Amount} for {ChitGroup}. Your current balance is {Balance}. Receipt No: {ReceiptNo}.",
                    IsEnabled = true
                },
                new()
                {
                    TenantId = tenantId,
                    Name = "AuctionWinner",
                    TitleTemplate = "Congratulations! You won the Auction",
                    MessageTemplate = "Dear {MemberName}, you have successfully won the auction for {ChitGroup} (Inst {InstallmentNo}) with a bid of {BidAmount}.",
                    IsEnabled = true
                },
                new()
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
    }
}
