CREATE TABLE [dbo].[Tenants] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(200) NOT NULL,
    [Subdomain] NVARCHAR(100) NOT NULL,
    [ConnectionString] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_GlobalTenants_ConnectionString] DEFAULT N'',
    [State] NVARCHAR(100) NOT NULL CONSTRAINT [DF_GlobalTenants_State] DEFAULT N'Karnataka',
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_GlobalTenants_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_GlobalTenants_IsActive] DEFAULT 1
);
GO

CREATE UNIQUE INDEX [IX_GlobalTenants_Subdomain] ON [dbo].[Tenants]([Subdomain]);
GO
