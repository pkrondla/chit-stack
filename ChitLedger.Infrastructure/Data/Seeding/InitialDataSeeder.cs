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
    }
}
