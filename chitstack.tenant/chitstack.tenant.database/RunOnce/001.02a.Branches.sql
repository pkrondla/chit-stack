CREATE TABLE [dbo].[Branches] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TenantId] INT NOT NULL,
    [Code] NVARCHAR(50) NOT NULL,
    [Name] NVARCHAR(200) NOT NULL,
    [Address] NVARCHAR(MAX) NULL,
    [ContactNumber] NVARCHAR(50) NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Branches_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Branches_IsActive] DEFAULT 1,
    CONSTRAINT [FK_Branches_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id])
);
GO

CREATE UNIQUE INDEX [IX_Branches_TenantId_Code] ON [dbo].[Branches]([TenantId], [Code]);
GO
