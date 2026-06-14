-- ============================================================
-- 002.01.DemoData.sql
-- Demo stamp pre-seeded data for trial users.
-- Applied once; the weekly Hangfire reset job re-runs this
-- to restore a clean state.
-- ============================================================

-- Idempotent: skip if already applied.
IF EXISTS (SELECT 1 FROM [dbo].[SeedHistory] WHERE [SeedKey] = '002.01.DemoData') GOTO Done;

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

-- Demo chit groups  (GroupStatus: 0=Proposed, 1=Active, 2=Completed, 3=Closed)
IF NOT EXISTS (SELECT 1 FROM [dbo].[ChitGroups] WHERE [GroupName] = N'Gold Chit Group - 20L' AND [TenantId] = @TenantId)
BEGIN
    INSERT INTO [dbo].[ChitGroups]
        ([GroupName], [ChitValue], [DurationMonths], [InstallmentAmount],
         [ForemanCommissionPercent], [Status], [TenantId], [BranchId], [CreatedBy])
    VALUES
        (N'Gold Chit Group - 20L',   2000000, 20, 100000, 5, 1, @TenantId, @BranchId, N'System'),
        (N'Silver Chit Group - 10L', 1000000, 20,  50000, 5, 1, @TenantId, @BranchId, N'System'),
        (N'Bronze Chit Group - 5L',   500000, 12,  41667, 5, 1, @TenantId, @BranchId, N'System');
END

-- Demo members
IF NOT EXISTS (SELECT 1 FROM [dbo].[Members] WHERE [PhoneNumber] = N'9876543210' AND [TenantId] = @TenantId)
BEGIN
    INSERT INTO [dbo].[Members]
        ([FullName], [PhoneNumber], [Email], [Address],
         [TenantId], [RegistrationBranchId], [CreatedBy])
    VALUES
        (N'Rajesh Kumar',  N'9876543210', N'rajesh@example.com',  N'123 MG Road, Bengaluru',      @TenantId, @BranchId, N'System'),
        (N'Priya Sharma',  N'9876543211', N'priya@example.com',   N'456 Brigade Road, Bengaluru', @TenantId, @BranchId, N'System'),
        (N'Suresh Reddy',  N'9876543212', N'suresh@example.com',  N'789 Residency Rd, Bengaluru', @TenantId, @BranchId, N'System'),
        (N'Anitha Nair',   N'9876543213', N'anitha@example.com',  N'12 Koramangala, Bengaluru',   @TenantId, @BranchId, N'System'),
        (N'Venkat Rao',    N'9876543214', N'venkat@example.com',  N'34 Indiranagar, Bengaluru',   @TenantId, @BranchId, N'System');
END

INSERT INTO [dbo].[SeedHistory] ([SeedKey]) VALUES ('002.01.DemoData');

Done:;
GO
