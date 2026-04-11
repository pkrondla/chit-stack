CREATE TABLE [dbo].[Branches]
(
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
)
GO
