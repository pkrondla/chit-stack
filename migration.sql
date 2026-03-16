BEGIN TRANSACTION;
DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tickets]') AND [c].[name] = N'BranchId');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Tickets] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Tickets] ALTER COLUMN [BranchId] int NULL;

ALTER TABLE [TenantSettings] ADD [MaxBiddingDiscountPercent] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [TenantSettings] ADD [TdsPercent] decimal(18,2) NOT NULL DEFAULT 0.0;

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Receipts]') AND [c].[name] = N'BranchId');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Receipts] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [Receipts] ALTER COLUMN [BranchId] int NULL;

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JournalEntryLines]') AND [c].[name] = N'BranchId');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [JournalEntryLines] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [JournalEntryLines] ALTER COLUMN [BranchId] int NULL;

ALTER TABLE [JournalEntryLines] ADD [IsReconciled] bit NOT NULL DEFAULT CAST(0 AS bit);

ALTER TABLE [JournalEntryLines] ADD [ReconciliationDate] datetime2 NULL;

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JournalEntries]') AND [c].[name] = N'BranchId');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [JournalEntries] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [JournalEntries] ALTER COLUMN [BranchId] int NULL;

ALTER TABLE [JournalEntries] ADD [InstrumentStatus] nvarchar(max) NOT NULL DEFAULT N'';

DECLARE @var4 sysname;
SELECT @var4 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Demands]') AND [c].[name] = N'BranchId');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [Demands] DROP CONSTRAINT [' + @var4 + '];');
ALTER TABLE [Demands] ALTER COLUMN [BranchId] int NULL;

DECLARE @var5 sysname;
SELECT @var5 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ChitGroups]') AND [c].[name] = N'BranchId');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [ChitGroups] DROP CONSTRAINT [' + @var5 + '];');
ALTER TABLE [ChitGroups] ALTER COLUMN [BranchId] int NULL;

DECLARE @var6 sysname;
SELECT @var6 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Auctions]') AND [c].[name] = N'BranchId');
IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Auctions] DROP CONSTRAINT [' + @var6 + '];');
ALTER TABLE [Auctions] ALTER COLUMN [BranchId] int NULL;

ALTER TABLE [Auctions] ADD [TdsAmount] decimal(18,2) NOT NULL DEFAULT 0.0;

DECLARE @var7 sysname;
SELECT @var7 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[AuctionAttendances]') AND [c].[name] = N'BranchId');
IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [AuctionAttendances] DROP CONSTRAINT [' + @var7 + '];');
ALTER TABLE [AuctionAttendances] ALTER COLUMN [BranchId] int NULL;

ALTER TABLE [AccountHeads] ADD [BankDetails] nvarchar(max) NULL;

ALTER TABLE [AccountHeads] ADD [BranchId] int NULL;

CREATE TABLE [AuctionBids] (
    [Id] int NOT NULL IDENTITY,
    [AuctionId] int NOT NULL,
    [TicketId] int NOT NULL,
    [BidAmount] decimal(18,2) NOT NULL,
    [BidTime] datetime2 NOT NULL,
    [Source] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NULL,
    CONSTRAINT [PK_AuctionBids] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AuctionBids_Auctions_AuctionId] FOREIGN KEY ([AuctionId]) REFERENCES [Auctions] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_AuctionBids_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [AuditLogs] (
    [Id] int NOT NULL IDENTITY,
    [EntityName] nvarchar(max) NOT NULL,
    [EntityId] int NOT NULL,
    [Action] nvarchar(max) NOT NULL,
    [DataBefore] nvarchar(max) NULL,
    [DataAfter] nvarchar(max) NULL,
    [UserId] nvarchar(max) NULL,
    [Timestamp] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
);

CREATE INDEX [IX_AuctionBids_AuctionId] ON [AuctionBids] ([AuctionId]);

CREATE INDEX [IX_AuctionBids_TicketId] ON [AuctionBids] ([TicketId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260316023140_AddAuditAndTds', N'9.0.0');

COMMIT;
GO

