CREATE TABLE [dbo].[Users] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Username] NVARCHAR(100) NOT NULL,
    [PasswordHash] NVARCHAR(MAX) NOT NULL,
    [Email] NVARCHAR(200) NULL,
    [Role] NVARCHAR(50) NOT NULL,
    [TenantId] INT NULL, -- Can be null for Global Admin? Or linked to a Tenant.
                         -- In V1, Users are scoped to Tenants.
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id])
);
GO
