CREATE TABLE [dbo].[Receipts] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ReceiptDate] DATETIME2 NOT NULL,
    [TicketId] INT NOT NULL,
    [AuctionId] INT NOT NULL,
    [AgentId] INT NULL,
    [CollectionSubmissionId] INT NULL,
    [AmountReceived] DECIMAL(18,2) NOT NULL,
    [PaymentMode] NVARCHAR(50) NOT NULL,
    [ReferenceNumber] NVARCHAR(100) NULL,
    [Status] NVARCHAR(50) NOT NULL CONSTRAINT [DF_Receipts_Status] DEFAULT N'Collected',
    [TransactionPhotoUrl] NVARCHAR(MAX) NULL,
    [Latitude] DECIMAL(18,6) NULL,
    [Longitude] DECIMAL(18,6) NULL,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Receipts_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Receipts_IsActive] DEFAULT 1,
    CONSTRAINT [FK_Receipts_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets]([Id]),
    CONSTRAINT [FK_Receipts_Auctions_AuctionId] FOREIGN KEY ([AuctionId]) REFERENCES [dbo].[Auctions]([Id]),
    CONSTRAINT [FK_Receipts_Users_AgentId] FOREIGN KEY ([AgentId]) REFERENCES [dbo].[Users]([Id])
);
GO

CREATE INDEX [IX_Receipts_TicketId] ON [dbo].[Receipts]([TicketId]);
GO

CREATE INDEX [IX_Receipts_AuctionId] ON [dbo].[Receipts]([AuctionId]);
GO

CREATE INDEX [IX_Receipts_AgentId] ON [dbo].[Receipts]([AgentId]);
GO

CREATE INDEX [IX_Receipts_CollectionSubmissionId] ON [dbo].[Receipts]([CollectionSubmissionId]);
GO

