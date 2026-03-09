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
    [AuctionStatus] NVARCHAR(50) DEFAULT 'Scheduled',
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([ChitGroupId]) REFERENCES [dbo].[ChitGroups]([Id]),
    FOREIGN KEY ([WinningTicketId]) REFERENCES [dbo].[Tickets]([Id]),
    -- FK Removed for Split DB
);
GO

