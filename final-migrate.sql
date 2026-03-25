-- Final Migration Script for Collection Agent System
-- Handles pre-existing tables and adds missing columns/tables

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__EFMigrationsHistory')
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END
GO

-- 1. USERS
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Users]') AND name = 'AssignedRouteId')
BEGIN
    ALTER TABLE [Users] ADD [AssignedRouteId] int NULL;
END
GO

-- 2. TICKETS
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Tickets]') AND name = 'AdvanceBalance')
BEGIN
    ALTER TABLE [Tickets] ADD [AdvanceBalance] decimal(18,2) NOT NULL DEFAULT 0.0;
END
GO

-- 3. TENANT SETTINGS
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[TenantSettings]') AND name = 'CompanyUpiId')
BEGIN
    ALTER TABLE [TenantSettings] ADD [CompanyUpiId] nvarchar(max) NULL;
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[TenantSettings]') AND name = 'CompanyUpiName')
BEGIN
    ALTER TABLE [TenantSettings] ADD [CompanyUpiName] nvarchar(max) NULL;
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[TenantSettings]') AND name = 'DefaultGracePeriodDays')
BEGIN
    ALTER TABLE [TenantSettings] ADD [DefaultGracePeriodDays] int NOT NULL DEFAULT 0;
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[TenantSettings]') AND name = 'DefaultLateFeePercent')
BEGIN
    ALTER TABLE [TenantSettings] ADD [DefaultLateFeePercent] decimal(18,2) NOT NULL DEFAULT 0.0;
END
GO

-- 4. RECEIPTS
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Receipts]') AND name = 'AgentId')
BEGIN
    ALTER TABLE [Receipts] ADD [AgentId] int NULL;
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Receipts]') AND name = 'CollectionSubmissionId')
BEGIN
    ALTER TABLE [Receipts] ADD [CollectionSubmissionId] int NULL;
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Receipts]') AND name = 'Latitude')
BEGIN
    ALTER TABLE [Receipts] ADD [Latitude] decimal(18,2) NULL;
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Receipts]') AND name = 'Longitude')
BEGIN
    ALTER TABLE [Receipts] ADD [Longitude] decimal(18,2) NULL;
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Receipts]') AND name = 'Status')
BEGIN
    ALTER TABLE [Receipts] ADD [Status] nvarchar(max) NOT NULL DEFAULT 'Submitted';
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Receipts]') AND name = 'TransactionPhotoUrl')
BEGIN
    ALTER TABLE [Receipts] ADD [TransactionPhotoUrl] nvarchar(max) NULL;
END
GO

-- 5. MEMBERS
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Members]') AND name = 'CollectionRouteId')
BEGIN
    ALTER TABLE [Members] ADD [CollectionRouteId] int NULL;
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Members]') AND name = 'Latitude')
BEGIN
    ALTER TABLE [Members] ADD [Latitude] decimal(18,2) NULL;
END
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Members]') AND name = 'Longitude')
BEGIN
    ALTER TABLE [Members] ADD [Longitude] decimal(18,2) NULL;
END
GO

-- 6. COLLECTION ROUTES TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CollectionRoutes')
BEGIN
    CREATE TABLE [CollectionRoutes] (
        [Id] int NOT NULL IDENTITY,
        [RouteName] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CreatedBy] nvarchar(max) NULL,
        [LastModifiedAt] datetime2 NULL,
        [LastModifiedBy] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [TenantId] int NOT NULL,
        [BranchId] int NULL,
        CONSTRAINT [PK_CollectionRoutes] PRIMARY KEY ([Id])
    );
END
GO

-- 7. COLLECTION SUBMISSIONS TABLE
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CollectionSubmissions')
BEGIN
    CREATE TABLE [CollectionSubmissions] (
        [Id] int NOT NULL IDENTITY,
        [AgentId] int NOT NULL,
        [SubmissionDate] datetime2 NOT NULL,
        [TotalAmount] decimal(18,2) NOT NULL,
        [TotalCash] decimal(18,2) NOT NULL,
        [TotalCheque] decimal(18,2) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [VerifiedByUserId] int NULL,
        [VerifiedById] int NULL,
        [VerifiedAt] datetime2 NULL,
        [Remarks] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CreatedBy] nvarchar(max) NULL,
        [LastModifiedAt] datetime2 NULL,
        [LastModifiedBy] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [TenantId] int NOT NULL,
        [BranchId] int NULL,
        CONSTRAINT [PK_CollectionSubmissions] PRIMARY KEY ([Id])
    );
END
GO

-- 8. UPDATE MIGRATION HISTORY
IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260313042408_UpdateAuctionDayOfMonthToString')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20260313042408_UpdateAuctionDayOfMonthToString', '9.0.0');
END

IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260324120956_CollectionAgentSystem')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20260324120956_CollectionAgentSystem', '9.0.0');
END
GO
