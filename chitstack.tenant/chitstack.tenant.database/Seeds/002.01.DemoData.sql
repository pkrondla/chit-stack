-- ============================================================
-- 002.01.DemoData.sql
-- Demo stamp pre-seeded data for trial users.
-- Applied once; the weekly Hangfire reset job re-runs this
-- to restore a clean state.
-- ============================================================

-- Idempotent: only insert if SeedHistory doesn't have this entry.
IF EXISTS (SELECT 1 FROM [dbo].[SeedHistory] WHERE [SeedName] = '002.01.DemoData') RETURN;

DECLARE @TenantId INT = 1;
DECLARE @BranchId INT;
DECLARE @TrialEnd DATETIME2 = DATEADD(DAY, 30, GETUTCDATE());

-- Ensure demo tenant row exists
IF NOT EXISTS (SELECT 1 FROM [dbo].[Tenants] WHERE [Id] = @TenantId)
BEGIN
    SET IDENTITY_INSERT [dbo].[Tenants] ON;
    INSERT INTO [dbo].[Tenants] ([Id], [TenantKey], [Name], [SubscriptionStatus], [CreatedBy])
    VALUES (@TenantId, N'demo', N'ChitStack Demo', N'Active', N'System');
    SET IDENTITY_INSERT [dbo].[Tenants] OFF;
END

-- Ensure headquarters branch exists
IF NOT EXISTS (SELECT 1 FROM [dbo].[Branches] WHERE [TenantId] = @TenantId AND [Code] = N'HQ')
BEGIN
    INSERT INTO [dbo].[Branches] ([Name], [Code], [TenantId], [CreatedBy])
    VALUES (N'Head Office', N'HQ', @TenantId, N'System');
END

SELECT @BranchId = [Id] FROM [dbo].[Branches] WHERE [TenantId] = @TenantId AND [Code] = N'HQ';

-- Demo admin user (shared by all trial registrants — each registrant gets own user via Registration API)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Username] = N'demo.admin' AND [TenantId] = @TenantId)
BEGIN
    INSERT INTO [dbo].[Users] ([Username], [PasswordHash], [Email], [FullName], [Role], [TenantId], [CreatedBy])
    VALUES (N'demo.admin', N'Demo@1234', N'demo@chitstack.com', N'Demo Admin', N'Admin', @TenantId, N'System');
END

-- Demo chit groups
IF NOT EXISTS (SELECT 1 FROM [dbo].[ChitGroups] WHERE [GroupCode] = N'DEMO-001' AND [TenantId] = @TenantId)
BEGIN
    INSERT INTO [dbo].[ChitGroups]
        ([GroupCode], [Name], [ChitValue], [Duration], [MemberCount], [MonthlyContribution],
         [CommissionRate], [Status], [TenantId], [BranchId], [CreatedBy])
    VALUES
        (N'DEMO-001', N'Gold Chit Group - 20L', 2000000, 20, 20, 100000, 5, N'Active', @TenantId, @BranchId, N'System'),
        (N'DEMO-002', N'Silver Chit Group - 10L', 1000000, 20, 20, 50000,  5, N'Active', @TenantId, @BranchId, N'System'),
        (N'DEMO-003', N'Bronze Chit Group - 5L',   500000, 12, 12, 41667,  5, N'Active', @TenantId, @BranchId, N'System');
END

-- Demo members
IF NOT EXISTS (SELECT 1 FROM [dbo].[Members] WHERE [MemberCode] = N'DM-001' AND [TenantId] = @TenantId)
BEGIN
    INSERT INTO [dbo].[Members]
        ([MemberCode], [FirstName], [LastName], [Email], [Phone], [Address], [City], [State],
         [TenantId], [BranchId], [CreatedBy])
    VALUES
        (N'DM-001', N'Rajesh',  N'Kumar',   N'rajesh@example.com',  N'9876543210', N'123 MG Road',     N'Bengaluru', N'Karnataka', @TenantId, @BranchId, N'System'),
        (N'DM-002', N'Priya',   N'Sharma',  N'priya@example.com',   N'9876543211', N'456 Brigade Rd',  N'Bengaluru', N'Karnataka', @TenantId, @BranchId, N'System'),
        (N'DM-003', N'Suresh',  N'Reddy',   N'suresh@example.com',  N'9876543212', N'789 Residency Rd',N'Bengaluru', N'Karnataka', @TenantId, @BranchId, N'System'),
        (N'DM-004', N'Anitha',  N'Nair',    N'anitha@example.com',  N'9876543213', N'12 Koramangala',  N'Bengaluru', N'Karnataka', @TenantId, @BranchId, N'System'),
        (N'DM-005', N'Venkat',  N'Rao',     N'venkat@example.com',  N'9876543214', N'34 Indiranagar',  N'Bengaluru', N'Karnataka', @TenantId, @BranchId, N'System');
END

INSERT INTO [dbo].[SeedHistory] ([SeedName]) VALUES ('002.01.DemoData');
GO
