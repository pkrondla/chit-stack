CREATE TABLE [dbo].[JournalEntries] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [EntryDate] DATETIME2 NOT NULL,
    [Description] NVARCHAR(MAX) NOT NULL,
    [EntryType] NVARCHAR(50) NOT NULL,
    [ReferenceId] INT NULL,
    [ReferenceType] NVARCHAR(50) NULL,
    [TenantId] INT NOT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    -- FK Removed for Split DB
);
GO

