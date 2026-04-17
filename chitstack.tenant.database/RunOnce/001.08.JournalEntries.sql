CREATE TABLE [dbo].[JournalEntries] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [EntryDate] DATETIME2 NOT NULL,
    [EntryType] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(MAX) NOT NULL,
    [ReferenceId] INT NULL,
    [ReferenceType] NVARCHAR(50) NOT NULL CONSTRAINT [DF_JournalEntries_ReferenceType] DEFAULT N'',
    [InstrumentStatus] NVARCHAR(50) NOT NULL CONSTRAINT [DF_JournalEntries_InstrumentStatus] DEFAULT N'None',
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_JournalEntries_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_JournalEntries_IsActive] DEFAULT 1
);
GO

