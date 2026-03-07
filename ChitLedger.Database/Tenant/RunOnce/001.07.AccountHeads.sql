CREATE TABLE [dbo].[AccountHeads] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AccountName] NVARCHAR(200) NOT NULL,
    [AccountCode] NVARCHAR(50) NOT NULL,
    [AccountType] INT NOT NULL, -- Enum: 0=Asset, 1=Liability, 2=Income, 3=Expense
    [IsSystemAccount] BIT NOT NULL DEFAULT 0,
    [TenantId] INT NOT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    -- FK Removed for Split DB
);
GO

