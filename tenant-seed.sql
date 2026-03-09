USE ChitLedgerTenant;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tenants]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Tenants] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TenantKey] NVARCHAR(100) NOT NULL UNIQUE,
    [Name] NVARCHAR(200) NOT NULL,
    [SubscriptionStatus] NVARCHAR(50) DEFAULT 'Active',
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Branches]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Branches] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [Code] NVARCHAR(50) NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [Address] NVARCHAR(MAX) NULL,
    [ContactNumber] NVARCHAR(50) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id])
);
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Users] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Username] NVARCHAR(100) NOT NULL,
    [PasswordHash] NVARCHAR(MAX) NOT NULL,
    [Email] NVARCHAR(200) NULL,
    [Role] NVARCHAR(50) NOT NULL,
    [TenantId] INT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id])
);
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserBranches]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[UserBranches] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [UserId] INT NOT NULL,
    [BranchId] INT NOT NULL,
    [IsPrimary] BIT NOT NULL DEFAULT 0,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]),
    FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
    FOREIGN KEY ([BranchId]) REFERENCES [dbo].[Branches]([Id])
);
END
GO

-- Patching columns
IF COL_LENGTH('dbo.Branches', 'CreatedBy') IS NULL
ALTER TABLE Branches ADD CreatedBy NVARCHAR(200) NULL, LastModifiedAt DATETIME2 NULL, LastModifiedBy NVARCHAR(200) NULL;

IF COL_LENGTH('dbo.UserBranches', 'CreatedBy') IS NULL
ALTER TABLE UserBranches ADD CreatedBy NVARCHAR(200) NULL, LastModifiedAt DATETIME2 NULL, LastModifiedBy NVARCHAR(200) NULL, IsActive BIT NOT NULL DEFAULT 1;

IF COL_LENGTH('dbo.Users', 'CreatedAt') IS NULL
ALTER TABLE Users ADD CreatedAt DATETIME2 NULL, CreatedBy NVARCHAR(200) NULL, FullName NVARCHAR(MAX) NULL, IsActive BIT NOT NULL DEFAULT 1, LastModifiedAt DATETIME2 NULL, LastModifiedBy NVARCHAR(200) NULL, MemberId INT NULL;

IF COL_LENGTH('dbo.Members', 'CreatedAt') IS NULL
ALTER TABLE Members ADD CreatedAt DATETIME2 NULL, CreatedBy NVARCHAR(200) NULL, LastModifiedAt DATETIME2 NULL, LastModifiedBy NVARCHAR(200) NULL, IsActive BIT NOT NULL DEFAULT 1;

IF COL_LENGTH('dbo.Members', 'RegistrationBranchId') IS NULL
ALTER TABLE Members ADD RegistrationBranchId INT NULL;

IF COL_LENGTH('dbo.ChitGroups', 'CreatedAt') IS NULL
ALTER TABLE ChitGroups ADD CreatedAt DATETIME2 NULL, CreatedBy NVARCHAR(200) NULL, LastModifiedAt DATETIME2 NULL, LastModifiedBy NVARCHAR(200) NULL, GracePeriodDays INT NOT NULL DEFAULT 5, LateFeePercent DECIMAL(18,2) NOT NULL DEFAULT 2.0, IsActive BIT NOT NULL DEFAULT 1;

IF COL_LENGTH('dbo.ChitGroups', 'BranchId') IS NULL
ALTER TABLE ChitGroups ADD BranchId INT NULL;

IF COL_LENGTH('dbo.Tickets', 'BranchId') IS NULL
ALTER TABLE Tickets ADD BranchId INT NULL;

IF COL_LENGTH('dbo.Auctions', 'BranchId') IS NULL
ALTER TABLE Auctions ADD BranchId INT NULL;

IF COL_LENGTH('dbo.Receipts', 'BranchId') IS NULL
ALTER TABLE Receipts ADD BranchId INT NULL;

IF COL_LENGTH('dbo.Demands', 'BranchId') IS NULL
ALTER TABLE Demands ADD BranchId INT NULL;

IF COL_LENGTH('dbo.JournalEntries', 'BranchId') IS NULL
ALTER TABLE JournalEntries ADD BranchId INT NULL;

IF COL_LENGTH('dbo.JournalEntryLines', 'BranchId') IS NULL
ALTER TABLE JournalEntryLines ADD BranchId INT NULL;

GO

UPDATE Users SET CreatedAt = GETUTCDATE(), FullName = '', CreatedBy = '', LastModifiedBy = '' WHERE CreatedAt IS NULL;

GO

IF NOT EXISTS(SELECT 1 FROM Tenants WHERE TenantKey = 'default')
BEGIN
    INSERT INTO Tenants (TenantKey, Name, SubscriptionStatus, IsActive, CreatedAt) VALUES ('default', 'Default Tenant', 'Active', 1, GETUTCDATE());
END
GO

DECLARE @TenantId INT = (SELECT Id FROM Tenants WHERE TenantKey = 'default');

IF NOT EXISTS(SELECT 1 FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, Role, TenantId, IsActive, CreatedAt, FullName) VALUES ('admin', 'admin123', 'admin@example.com', 'Admin', @TenantId, 1, GETUTCDATE(), 'Admin User');
END
GO

-- Seed Default Branch
DECLARE @TenantId INT = (SELECT Id FROM Tenants WHERE TenantKey = 'default');
IF NOT EXISTS(SELECT 1 FROM Branches WHERE Code = 'HQ')
BEGIN
    INSERT INTO Branches (TenantId, Code, Name, Address, ContactNumber, IsActive, CreatedAt)
    VALUES (@TenantId, 'HQ', 'Headquarters', '123 Main St', '555-0100', 1, GETUTCDATE());
END
GO

-- Map Admin to HQ Branch
DECLARE @TenantId INT = (SELECT Id FROM Tenants WHERE TenantKey = 'default');

-- Alter Tickets table to allow nullable MemberId for handling vacancies without losing the slot
IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'MemberId' AND Object_ID = Object_ID(N'Tickets'))
BEGIN
    ALTER TABLE Tickets ALTER COLUMN MemberId INT NULL;
END
GO
DECLARE @AdminId INT = (SELECT Id FROM Users WHERE Username = 'admin');
DECLARE @HQBranchId INT = (SELECT Id FROM Branches WHERE Code = 'HQ');

IF NOT EXISTS(SELECT 1 FROM UserBranches WHERE UserId = @AdminId AND BranchId = @HQBranchId)
BEGIN
    INSERT INTO UserBranches (TenantId, UserId, BranchId, IsPrimary, IsActive, CreatedAt)
    VALUES (@TenantId, @AdminId, @HQBranchId, 1, 1, GETUTCDATE());
END
GO
