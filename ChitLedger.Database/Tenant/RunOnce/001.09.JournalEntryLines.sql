CREATE TABLE [dbo].[JournalEntryLines] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [JournalEntryId] INT NOT NULL,
    [AccountHeadId] INT NOT NULL,
    [DebitAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [CreditAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [Description] NVARCHAR(MAX) NULL,
    [TenantId] INT NOT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([JournalEntryId]) REFERENCES [dbo].[JournalEntries]([Id]),
    FOREIGN KEY ([AccountHeadId]) REFERENCES [dbo].[AccountHeads]([Id]),
    -- FK Removed for Split DB
);
GO

