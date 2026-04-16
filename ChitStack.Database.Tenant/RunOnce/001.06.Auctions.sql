CREATE TABLE [dbo].[Auctions] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ChitGroupId] INT NOT NULL,
    [InstallmentNumber] INT NOT NULL,
    [AuctionDate] DATETIME2 NOT NULL,
    [WinningTicketId] INT NULL,
    [WinningBidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [DividendAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [NetPayableAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [ForemanCommissionAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [AuctionStatus] NVARCHAR(50) NOT NULL CONSTRAINT [DF_Auctions_AuctionStatus] DEFAULT N'Scheduled',
    [IsPaid] BIT NOT NULL CONSTRAINT [DF_Auctions_IsPaid] DEFAULT 0,
    [PaymentDate] DATETIME2 NULL,
    [PaymentMode] NVARCHAR(50) NULL,
    [PaymentReference] NVARCHAR(200) NULL,
    [TdsAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Auctions_TdsAmount] DEFAULT 0,
    [SessionStartedAt] DATETIME2 NULL,
    [SessionDurationMinutes] INT NOT NULL CONSTRAINT [DF_Auctions_SessionDurationMinutes] DEFAULT 0,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Auctions_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Auctions_IsActive] DEFAULT 1,
    CONSTRAINT [FK_Auctions_ChitGroups_ChitGroupId] FOREIGN KEY ([ChitGroupId]) REFERENCES [dbo].[ChitGroups]([Id]),
    CONSTRAINT [FK_Auctions_Tickets_WinningTicketId] FOREIGN KEY ([WinningTicketId]) REFERENCES [dbo].[Tickets]([Id])
);
GO

CREATE INDEX [IX_Auctions_ChitGroupId] ON [dbo].[Auctions]([ChitGroupId]);
GO

CREATE INDEX [IX_Auctions_WinningTicketId] ON [dbo].[Auctions]([WinningTicketId]);
GO

