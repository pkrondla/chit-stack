IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [AccountHeads] (
    [Id] int NOT NULL IDENTITY,
    [AccountName] nvarchar(max) NOT NULL,
    [AccountCode] nvarchar(max) NOT NULL,
    [Type] int NOT NULL,
    [IsSystem] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_AccountHeads] PRIMARY KEY ([Id])
);

CREATE TABLE [Branches] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Code] nvarchar(max) NOT NULL,
    [Address] nvarchar(max) NULL,
    [ContactNumber] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_Branches] PRIMARY KEY ([Id])
);

CREATE TABLE [ChitGroups] (
    [Id] int NOT NULL IDENTITY,
    [GroupName] nvarchar(max) NOT NULL,
    [ChitValue] decimal(18,2) NOT NULL,
    [DurationMonths] int NOT NULL,
    [InstallmentAmount] decimal(18,2) NOT NULL,
    [ForemanCommissionPercent] decimal(18,2) NOT NULL,
    [LaunchDate] datetime2 NULL,
    [Status] int NOT NULL,
    [LateFeePercent] decimal(18,2) NOT NULL,
    [GracePeriodDays] int NOT NULL,
    [SanctionNumber] nvarchar(max) NULL,
    [SanctionDate] datetime2 NULL,
    [RegistrationNumber] nvarchar(max) NULL,
    [RegistrationDate] datetime2 NULL,
    [AuctionVenueAddress] nvarchar(max) NULL,
    [SecurityDepositBankName] nvarchar(max) NULL,
    [SecurityDepositBankBranch] nvarchar(max) NULL,
    [SecurityDepositFdrNumber] nvarchar(max) NULL,
    [SecurityDepositDate] datetime2 NULL,
    [FilingFees] decimal(18,2) NOT NULL,
    [AuctionScheduleMode] nvarchar(max) NULL,
    [AuctionDayOfMonth] nvarchar(max) NULL,
    [AuctionWeekNumber] int NULL,
    [AuctionDayOfWeek] int NULL,
    [AuctionTime] time NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NOT NULL,
    CONSTRAINT [PK_ChitGroups] PRIMARY KEY ([Id])
);

CREATE TABLE [HolidayDates] (
    [Id] int NOT NULL IDENTITY,
    [Date] date NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [IsRecurringYearly] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_HolidayDates] PRIMARY KEY ([Id])
);

CREATE TABLE [JournalEntries] (
    [Id] int NOT NULL IDENTITY,
    [EntryDate] datetime2 NOT NULL,
    [EntryType] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [ReferenceId] int NULL,
    [ReferenceType] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NOT NULL,
    [InstrumentStatus] nvarchar(max) NOT NULL DEFAULT N'None',
    CONSTRAINT [PK_JournalEntries] PRIMARY KEY ([Id])
);

CREATE TABLE [Tenants] (
    [Id] int NOT NULL IDENTITY,
    [TenantKey] nvarchar(max) NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [SubscriptionStatus] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_Tenants] PRIMARY KEY ([Id])
);

CREATE TABLE [TenantSettings] (
    [Id] int NOT NULL IDENTITY,
    [CompanyName] nvarchar(max) NOT NULL,
    [RegistrationNumber] nvarchar(max) NOT NULL,
    [RegisteredOfficeAddress] nvarchar(max) NOT NULL,
    [ForemanName] nvarchar(max) NOT NULL,
    [ForemanDesignation] nvarchar(max) NOT NULL,
    [PhoneNumber] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [StatutoryFilingFees] decimal(18,2) NOT NULL,
    [GstNumber] nvarchar(max) NULL,
    [PanNumber] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [TdsPercent] decimal(18,2) NOT NULL DEFAULT 0.0,
    [MaxBiddingDiscountPercent] decimal(18,2) NOT NULL DEFAULT 40.0,
    CONSTRAINT [PK_TenantSettings] PRIMARY KEY ([Id])
);

CREATE TABLE [Members] (
    [Id] int NOT NULL IDENTITY,
    [FullName] nvarchar(max) NOT NULL,
    [PhoneNumber] nvarchar(20) NOT NULL,
    [Email] nvarchar(max) NULL,
    [Address] nvarchar(max) NULL,
    [PanNumber] nvarchar(max) NULL,
    [PanDocumentUrl] nvarchar(max) NULL,
    [AadhaarNumber] nvarchar(max) NULL,
    [AadhaarDocumentUrl] nvarchar(max) NULL,
    [PhotoUrl] nvarchar(max) NULL,
    [KycVerified] bit NOT NULL,
    [RegistrationBranchId] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_Members] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Members_Branches_RegistrationBranchId] FOREIGN KEY ([RegistrationBranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [JournalEntryLines] (
    [Id] int NOT NULL IDENTITY,
    [JournalEntryId] int NOT NULL,
    [AccountHeadId] int NOT NULL,
    [DebitAmount] decimal(18,2) NOT NULL,
    [CreditAmount] decimal(18,2) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NOT NULL,
    [IsReconciled] bit NOT NULL DEFAULT CAST(0 AS bit),
    [ReconciliationDate] datetime2 NULL,
    CONSTRAINT [PK_JournalEntryLines] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_JournalEntryLines_AccountHeads_AccountHeadId] FOREIGN KEY ([AccountHeadId]) REFERENCES [AccountHeads] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_JournalEntryLines_JournalEntries_JournalEntryId] FOREIGN KEY ([JournalEntryId]) REFERENCES [JournalEntries] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Tickets] (
    [Id] int NOT NULL IDENTITY,
    [ChitGroupId] int NOT NULL,
    [MemberId] int NULL,
    [TicketNumber] int NOT NULL,
    [IsPrized] bit NOT NULL,
    [PrizedInstallment] int NULL,
    [Status] int NOT NULL,
    [IsForeman] bit NOT NULL,
    [RemovalDate] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NOT NULL,
    CONSTRAINT [PK_Tickets] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Tickets_ChitGroups_ChitGroupId] FOREIGN KEY ([ChitGroupId]) REFERENCES [ChitGroups] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Tickets_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [Members] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [Username] nvarchar(max) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [FullName] nvarchar(max) NOT NULL,
    [Role] nvarchar(max) NOT NULL,
    [MemberId] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Users_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [Members] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Auctions] (
    [Id] int NOT NULL IDENTITY,
    [ChitGroupId] int NOT NULL,
    [InstallmentNumber] int NOT NULL,
    [AuctionDate] datetime2 NOT NULL,
    [AuctionStatus] nvarchar(max) NOT NULL,
    [WinningTicketId] int NULL,
    [WinningBidAmount] decimal(18,2) NOT NULL,
    [ForemanCommissionAmount] decimal(18,2) NOT NULL,
    [DividendAmount] decimal(18,2) NOT NULL,
    [NetPayableAmount] decimal(18,2) NOT NULL,
    [IsPaid] bit NOT NULL,
    [PaymentDate] datetime2 NULL,
    [PaymentMode] nvarchar(max) NULL,
    [PaymentReference] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NOT NULL,
    [TdsAmount] decimal(18,2) NOT NULL DEFAULT 0.0,
    CONSTRAINT [PK_Auctions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Auctions_ChitGroups_ChitGroupId] FOREIGN KEY ([ChitGroupId]) REFERENCES [ChitGroups] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Auctions_Tickets_WinningTicketId] FOREIGN KEY ([WinningTicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Guarantors] (
    [Id] int NOT NULL IDENTITY,
    [TicketId] int NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [PhoneNumber] nvarchar(max) NOT NULL,
    [AadhaarNumber] nvarchar(max) NOT NULL,
    [Occupation] nvarchar(max) NOT NULL,
    [AnnualIncome] decimal(18,2) NOT NULL,
    [Relationship] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_Guarantors] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Guarantors_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Nominees] (
    [Id] int NOT NULL IDENTITY,
    [FullName] nvarchar(max) NOT NULL,
    [Relationship] nvarchar(max) NOT NULL,
    [DateOfBirth] datetime2 NOT NULL,
    [AadhaarNumber] nvarchar(max) NULL,
    [PhoneNumber] nvarchar(max) NULL,
    [GuardianName] nvarchar(max) NULL,
    [GuardianRelationship] nvarchar(max) NULL,
    [TicketId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_Nominees] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Nominees_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [UserBranches] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [BranchId] int NOT NULL,
    [IsPrimary] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_UserBranches] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_UserBranches_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_UserBranches_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Demands] (
    [Id] int NOT NULL IDENTITY,
    [TicketId] int NOT NULL,
    [AuctionId] int NOT NULL,
    [InstallmentNumber] int NOT NULL,
    [GrossAmount] decimal(18,2) NOT NULL,
    [DividendAmount] decimal(18,2) NOT NULL,
    [NetAmount] decimal(18,2) NOT NULL,
    [CollectedAmount] decimal(18,2) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [PenaltyAmount] decimal(18,2) NOT NULL,
    [DueDate] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NOT NULL,
    CONSTRAINT [PK_Demands] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Demands_Auctions_AuctionId] FOREIGN KEY ([AuctionId]) REFERENCES [Auctions] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Demands_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Receipts] (
    [Id] int NOT NULL IDENTITY,
    [TicketId] int NOT NULL,
    [AuctionId] int NOT NULL,
    [AmountReceived] decimal(18,2) NOT NULL,
    [ReceiptDate] datetime2 NOT NULL,
    [PaymentMode] nvarchar(max) NOT NULL,
    [ReferenceNumber] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NOT NULL,
    CONSTRAINT [PK_Receipts] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Receipts_Auctions_AuctionId] FOREIGN KEY ([AuctionId]) REFERENCES [Auctions] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Receipts_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_Auctions_ChitGroupId] ON [Auctions] ([ChitGroupId]);

CREATE INDEX [IX_Auctions_WinningTicketId] ON [Auctions] ([WinningTicketId]);

CREATE INDEX [IX_Demands_AuctionId] ON [Demands] ([AuctionId]);

CREATE INDEX [IX_Demands_TicketId] ON [Demands] ([TicketId]);

CREATE INDEX [IX_Guarantors_TicketId] ON [Guarantors] ([TicketId]);

CREATE INDEX [IX_JournalEntryLines_AccountHeadId] ON [JournalEntryLines] ([AccountHeadId]);

CREATE INDEX [IX_JournalEntryLines_JournalEntryId] ON [JournalEntryLines] ([JournalEntryId]);

CREATE UNIQUE INDEX [IX_Members_PhoneNumber] ON [Members] ([PhoneNumber]);

CREATE INDEX [IX_Members_RegistrationBranchId] ON [Members] ([RegistrationBranchId]);

CREATE INDEX [IX_Nominees_TicketId] ON [Nominees] ([TicketId]);

CREATE INDEX [IX_Receipts_AuctionId] ON [Receipts] ([AuctionId]);

CREATE INDEX [IX_Receipts_TicketId] ON [Receipts] ([TicketId]);

CREATE UNIQUE INDEX [IX_Tickets_ChitGroupId_TicketNumber] ON [Tickets] ([ChitGroupId], [TicketNumber]);

CREATE INDEX [IX_Tickets_MemberId] ON [Tickets] ([MemberId]);

CREATE INDEX [IX_UserBranches_BranchId] ON [UserBranches] ([BranchId]);

CREATE INDEX [IX_UserBranches_UserId] ON [UserBranches] ([UserId]);

CREATE INDEX [IX_Users_MemberId] ON [Users] ([MemberId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260313042408_UpdateAuctionDayOfMonthToString', N'9.0.0');

CREATE TABLE [AuctionAttendances] (
    [Id] int NOT NULL IDENTITY,
    [AuctionId] int NOT NULL,
    [TicketId] int NOT NULL,
    [AttendanceTime] datetime2 NULL,
    [IsPresent] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NOT NULL,
    CONSTRAINT [PK_AuctionAttendances] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AuctionAttendances_Auctions_AuctionId] FOREIGN KEY ([AuctionId]) REFERENCES [Auctions] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_AuctionAttendances_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_AuctionAttendances_AuctionId] ON [AuctionAttendances] ([AuctionId]);

CREATE INDEX [IX_AuctionAttendances_TicketId] ON [AuctionAttendances] ([TicketId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260314013516_AddAuctionAttendance_Tenant', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260314021800_AddAuctionAttendance', N'9.0.0');

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tickets]') AND [c].[name] = N'BranchId');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Tickets] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Tickets] ALTER COLUMN [BranchId] int NULL;

ALTER TABLE [TenantSettings] ADD [MaxBiddingDiscountPercent] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [TenantSettings] ADD [TdsPercent] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [TenantSettings] ADD [GstPercent] decimal(18,2) NOT NULL DEFAULT 18.0;

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

ALTER TABLE [TenantSettings] ADD [GstPercent] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [AuctionBids] ADD [IsLotteryWinner] bit NOT NULL DEFAULT CAST(0 AS bit);

ALTER TABLE [AccountHeads] ADD [SystemRole] nvarchar(max) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260319092801_AddIsLotteryWinner', N'9.0.0');

ALTER TABLE [Users] ADD [AssignedRouteId] int NULL;

ALTER TABLE [Tickets] ADD [AdvanceBalance] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [TenantSettings] ADD [CompanyUpiId] nvarchar(max) NULL;

ALTER TABLE [TenantSettings] ADD [CompanyUpiName] nvarchar(max) NULL;

ALTER TABLE [TenantSettings] ADD [DefaultGracePeriodDays] int NOT NULL DEFAULT 0;

ALTER TABLE [TenantSettings] ADD [DefaultLateFeePercent] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [Receipts] ADD [AgentId] int NULL;

ALTER TABLE [Receipts] ADD [CollectionSubmissionId] int NULL;

ALTER TABLE [Receipts] ADD [Latitude] decimal(18,2) NULL;

ALTER TABLE [Receipts] ADD [Longitude] decimal(18,2) NULL;

ALTER TABLE [Receipts] ADD [Status] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Receipts] ADD [TransactionPhotoUrl] nvarchar(max) NULL;

ALTER TABLE [Members] ADD [CollectionRouteId] int NULL;

ALTER TABLE [Members] ADD [Latitude] decimal(18,2) NULL;

ALTER TABLE [Members] ADD [Longitude] decimal(18,2) NULL;

ALTER TABLE [Auctions] ADD [SessionDurationMinutes] int NOT NULL DEFAULT 0;

ALTER TABLE [Auctions] ADD [SessionStartedAt] datetime2 NULL;

CREATE TABLE [CollectionRoutes] (
    [Id] int NOT NULL IDENTITY,
    [RouteName] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NULL,
    CONSTRAINT [PK_CollectionRoutes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CollectionRoutes_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [CollectionSubmissions] (
    [Id] int NOT NULL IDENTITY,
    [AgentId] int NOT NULL,
    [SubmissionDate] datetime2 NOT NULL,
    [TotalAmount] decimal(18,2) NOT NULL,
    [TotalCash] decimal(18,2) NOT NULL,
    [TotalCheque] decimal(18,2) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [VerifiedByUserId] int NULL,
    [VerifiedById] int NULL,
    [VerifiedAt] datetime2 NULL,
    [Remarks] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CreatedBy] nvarchar(max) NULL,
    [LastModifiedAt] datetime2 NULL,
    [LastModifiedBy] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [TenantId] int NOT NULL,
    [BranchId] int NULL,
    CONSTRAINT [PK_CollectionSubmissions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CollectionSubmissions_Users_AgentId] FOREIGN KEY ([AgentId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_CollectionSubmissions_Users_VerifiedById] FOREIGN KEY ([VerifiedById]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_Users_AssignedRouteId] ON [Users] ([AssignedRouteId]);

CREATE INDEX [IX_Receipts_AgentId] ON [Receipts] ([AgentId]);

CREATE INDEX [IX_Receipts_CollectionSubmissionId] ON [Receipts] ([CollectionSubmissionId]);

CREATE INDEX [IX_Members_CollectionRouteId] ON [Members] ([CollectionRouteId]);

CREATE INDEX [IX_CollectionRoutes_BranchId] ON [CollectionRoutes] ([BranchId]);

CREATE INDEX [IX_CollectionSubmissions_AgentId] ON [CollectionSubmissions] ([AgentId]);

CREATE INDEX [IX_CollectionSubmissions_VerifiedById] ON [CollectionSubmissions] ([VerifiedById]);

ALTER TABLE [Members] ADD CONSTRAINT [FK_Members_CollectionRoutes_CollectionRouteId] FOREIGN KEY ([CollectionRouteId]) REFERENCES [CollectionRoutes] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [Receipts] ADD CONSTRAINT [FK_Receipts_CollectionSubmissions_CollectionSubmissionId] FOREIGN KEY ([CollectionSubmissionId]) REFERENCES [CollectionSubmissions] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [Receipts] ADD CONSTRAINT [FK_Receipts_Users_AgentId] FOREIGN KEY ([AgentId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [Users] ADD CONSTRAINT [FK_Users_CollectionRoutes_AssignedRouteId] FOREIGN KEY ([AssignedRouteId]) REFERENCES [CollectionRoutes] ([Id]) ON DELETE NO ACTION;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260324120956_CollectionAgentSystem', N'9.0.0');

COMMIT;
GO

