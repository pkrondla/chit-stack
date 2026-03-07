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

-- Patching columns
IF COL_LENGTH('dbo.Users', 'CreatedAt') IS NULL
ALTER TABLE Users ADD CreatedAt DATETIME2 NULL, CreatedBy NVARCHAR(200) NULL, FullName NVARCHAR(MAX) NULL, IsActive BIT NOT NULL DEFAULT 1, LastModifiedAt DATETIME2 NULL, LastModifiedBy NVARCHAR(200) NULL, MemberId INT NULL;

IF COL_LENGTH('dbo.Members', 'CreatedAt') IS NULL
ALTER TABLE Members ADD CreatedAt DATETIME2 NULL, CreatedBy NVARCHAR(200) NULL, LastModifiedAt DATETIME2 NULL, LastModifiedBy NVARCHAR(200) NULL, IsActive BIT NOT NULL DEFAULT 1;

IF COL_LENGTH('dbo.ChitGroups', 'CreatedAt') IS NULL
ALTER TABLE ChitGroups ADD CreatedAt DATETIME2 NULL, CreatedBy NVARCHAR(200) NULL, LastModifiedAt DATETIME2 NULL, LastModifiedBy NVARCHAR(200) NULL, GracePeriodDays INT NOT NULL DEFAULT 5, LateFeePercent DECIMAL(18,2) NOT NULL DEFAULT 2.0, IsActive BIT NOT NULL DEFAULT 1;

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
