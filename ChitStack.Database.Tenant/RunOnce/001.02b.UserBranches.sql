CREATE TABLE [dbo].[UserBranches]
(
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
)
GO
