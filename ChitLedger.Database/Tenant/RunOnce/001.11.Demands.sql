CREATE TABLE [dbo].[Demands] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TicketId] INT NOT NULL,
    [AuctionId] INT NOT NULL,
    [InstallmentNumber] INT NOT NULL,
    [DueAmount] DECIMAL(18,2) NOT NULL,
    [PaidAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [Status] NVARCHAR(50) DEFAULT 'Pending',
    [DueDate] DATETIME2 NOT NULL,
    [TenantId] INT NOT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets]([Id]),
    FOREIGN KEY ([AuctionId]) REFERENCES [dbo].[Auctions]([Id]),
    -- FK Removed for Split DB
);
GO

