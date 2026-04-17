CREATE TABLE [dbo].[Users] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Username] NVARCHAR(100) NOT NULL,
    [PasswordHash] NVARCHAR(MAX) NOT NULL,
    [Email] NVARCHAR(200) NOT NULL,
    [FullName] NVARCHAR(200) NOT NULL,
    [Role] NVARCHAR(50) NOT NULL CONSTRAINT [DF_GlobalUsers_Role] DEFAULT N'Admin',
    [TenantId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_GlobalUsers_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_GlobalUsers_IsActive] DEFAULT 1,
    CONSTRAINT [FK_GlobalUsers_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id])
);
GO

CREATE UNIQUE INDEX [IX_GlobalUsers_Username] ON [dbo].[Users]([Username]);
GO
