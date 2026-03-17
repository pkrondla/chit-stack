USE ChitLedgerTenant;
GO

-- 1. Create AuditLogs table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[AuditLogs]') AND type in (N'U'))
BEGIN
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
END
GO

-- 2. Add TDS columns to TenantSettings
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[TenantSettings]') AND name = N'TdsPercent')
BEGIN
    ALTER TABLE [TenantSettings] ADD [TdsPercent] decimal(18,2) NOT NULL DEFAULT 0.0;
END
GO

-- 3. Add TDS columns to Auctions
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Auctions]') AND name = N'TdsAmount')
BEGIN
    ALTER TABLE [Auctions] ADD [TdsAmount] decimal(18,2) NOT NULL DEFAULT 0.0;
END
GO

-- 4. Ensure MaxBiddingDiscountPercent exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[TenantSettings]') AND name = N'MaxBiddingDiscountPercent')
BEGIN
    ALTER TABLE [TenantSettings] ADD [MaxBiddingDiscountPercent] decimal(18,2) NOT NULL DEFAULT 40.0;
END
GO

-- 5. Add InstrumentStatus to JournalEntries
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[JournalEntries]') AND name = N'InstrumentStatus')
BEGIN
    ALTER TABLE [JournalEntries] ADD [InstrumentStatus] nvarchar(max) NOT NULL DEFAULT 'None';
END
GO

-- 6. Add Reconciliation columns to JournalEntryLines
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[JournalEntryLines]') AND name = N'IsReconciled')
BEGIN
    ALTER TABLE [JournalEntryLines] ADD [IsReconciled] bit NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[JournalEntryLines]') AND name = N'ReconciliationDate')
BEGIN
    ALTER TABLE [JournalEntryLines] ADD [ReconciliationDate] datetime2 NULL;
END
GO

-- 7. Mark migration as applied
IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260316023140_AddAuditAndTds')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260316023140_AddAuditAndTds', N'9.0.0');
END
GO
