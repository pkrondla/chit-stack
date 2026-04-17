CREATE TABLE [dbo].[JournalEntryLines] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [JournalEntryId] INT NOT NULL,
    [AccountHeadId] INT NOT NULL,
    [DebitAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [CreditAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [Description] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_JournalEntryLines_Description] DEFAULT N'',
    [MemberId] INT NULL,
    [ChitGroupId] INT NULL,
    [TicketId] INT NULL,
    [AuctionId] INT NULL,
    [IsReconciled] BIT NOT NULL CONSTRAINT [DF_JournalEntryLines_IsReconciled] DEFAULT 0,
    [ReconciliationDate] DATETIME2 NULL,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_JournalEntryLines_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_JournalEntryLines_IsActive] DEFAULT 1,
    CONSTRAINT [FK_JournalEntryLines_JournalEntries_JournalEntryId] FOREIGN KEY ([JournalEntryId]) REFERENCES [dbo].[JournalEntries]([Id]),
    CONSTRAINT [FK_JournalEntryLines_AccountHeads_AccountHeadId] FOREIGN KEY ([AccountHeadId]) REFERENCES [dbo].[AccountHeads]([Id]),
    CONSTRAINT [FK_JournalEntryLines_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members]([Id]),
    CONSTRAINT [FK_JournalEntryLines_ChitGroups_ChitGroupId] FOREIGN KEY ([ChitGroupId]) REFERENCES [dbo].[ChitGroups]([Id]),
    CONSTRAINT [FK_JournalEntryLines_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets]([Id]),
    CONSTRAINT [FK_JournalEntryLines_Auctions_AuctionId] FOREIGN KEY ([AuctionId]) REFERENCES [dbo].[Auctions]([Id])
);
GO

CREATE INDEX [IX_JournalEntryLines_JournalEntryId] ON [dbo].[JournalEntryLines]([JournalEntryId]);
GO

CREATE INDEX [IX_JournalEntryLines_AccountHeadId] ON [dbo].[JournalEntryLines]([AccountHeadId]);
GO

CREATE INDEX [IX_JournalEntryLines_MemberId] ON [dbo].[JournalEntryLines]([MemberId]);
GO

CREATE INDEX [IX_JournalEntryLines_ChitGroupId] ON [dbo].[JournalEntryLines]([ChitGroupId]);
GO

CREATE INDEX [IX_JournalEntryLines_TicketId] ON [dbo].[JournalEntryLines]([TicketId]);
GO

CREATE INDEX [IX_JournalEntryLines_AuctionId] ON [dbo].[JournalEntryLines]([AuctionId]);
GO

