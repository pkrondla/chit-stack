CREATE TABLE [dbo].[Tenants] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TenantKey] NVARCHAR(100) NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [SubscriptionStatus] NVARCHAR(50) NOT NULL CONSTRAINT [DF_Tenants_SubscriptionStatus] DEFAULT N'Active',
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Tenants_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Tenants_IsActive] DEFAULT 1
);
GO

CREATE UNIQUE INDEX [IX_Tenants_TenantKey] ON [dbo].[Tenants]([TenantKey]);
GO
