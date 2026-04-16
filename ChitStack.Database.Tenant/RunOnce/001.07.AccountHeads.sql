CREATE TABLE [dbo].[AccountHeads] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AccountName] NVARCHAR(200) NOT NULL,
    [AccountCode] NVARCHAR(50) NOT NULL,
    [Type] INT NOT NULL,
    [IsSystem] BIT NOT NULL CONSTRAINT [DF_AccountHeads_IsSystem] DEFAULT 0,
    [SystemRole] NVARCHAR(100) NULL,
    [BranchId] INT NULL,
    [ParentId] INT NULL,
    [IsGroup] BIT NOT NULL CONSTRAINT [DF_AccountHeads_IsGroup] DEFAULT 0,
    [BankDetails] NVARCHAR(MAX) NULL,
    [OpeningBalance] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_AccountHeads_OpeningBalance] DEFAULT 0,
    [TenantId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_AccountHeads_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_AccountHeads_IsActive] DEFAULT 1,
    CONSTRAINT [FK_AccountHeads_Parent] FOREIGN KEY ([ParentId]) REFERENCES [dbo].[AccountHeads]([Id])
);
GO

CREATE INDEX [IX_AccountHeads_ParentId] ON [dbo].[AccountHeads]([ParentId]);
GO

