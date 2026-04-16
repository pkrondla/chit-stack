CREATE TABLE [dbo].[Demands] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TicketId] INT NOT NULL,
    [AuctionId] INT NOT NULL,
    [InstallmentNumber] INT NOT NULL,
    [GrossAmount] DECIMAL(18,2) NOT NULL,
    [DividendAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Demands_DividendAmount] DEFAULT 0,
    [NetAmount] DECIMAL(18,2) NOT NULL,
    [CollectedAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Demands_CollectedAmount] DEFAULT 0,
    [Status] NVARCHAR(50) NOT NULL CONSTRAINT [DF_Demands_Status] DEFAULT N'Pending',
    [PenaltyAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Demands_PenaltyAmount] DEFAULT 0,
    [DueDate] DATETIME2 NOT NULL,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Demands_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Demands_IsActive] DEFAULT 1,
    CONSTRAINT [FK_Demands_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets]([Id]),
    CONSTRAINT [FK_Demands_Auctions_AuctionId] FOREIGN KEY ([AuctionId]) REFERENCES [dbo].[Auctions]([Id])
);
GO

CREATE INDEX [IX_Demands_TicketId] ON [dbo].[Demands]([TicketId]);
GO

CREATE INDEX [IX_Demands_AuctionId] ON [dbo].[Demands]([AuctionId]);
GO

