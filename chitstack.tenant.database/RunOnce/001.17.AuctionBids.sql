CREATE TABLE [dbo].[AuctionBids] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AuctionId] INT NOT NULL,
    [TicketId] INT NOT NULL,
    [BidAmount] DECIMAL(18,2) NOT NULL,
    [BidTime] DATETIME2 NOT NULL,
    [Source] NVARCHAR(50) NOT NULL,
    [IsLotteryWinner] BIT NOT NULL CONSTRAINT [DF_AuctionBids_IsLotteryWinner] DEFAULT 0,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_AuctionBids_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_AuctionBids_IsActive] DEFAULT 1,
    CONSTRAINT [FK_AuctionBids_Auctions_AuctionId] FOREIGN KEY ([AuctionId]) REFERENCES [dbo].[Auctions]([Id]),
    CONSTRAINT [FK_AuctionBids_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets]([Id])
);
GO

CREATE INDEX [IX_AuctionBids_AuctionId] ON [dbo].[AuctionBids]([AuctionId]);
GO

CREATE INDEX [IX_AuctionBids_TicketId] ON [dbo].[AuctionBids]([TicketId]);
GO
