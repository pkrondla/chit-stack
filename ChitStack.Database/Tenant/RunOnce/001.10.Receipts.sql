CREATE TABLE [dbo].[Receipts] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ReceiptDate] DATETIME2 NOT NULL,
    [MemberId] INT NOT NULL,
    [ChitGroupId] INT NOT NULL,
    [TicketId] INT NOT NULL,
    [Amount] DECIMAL(18,2) NOT NULL,
    [PaymentMode] NVARCHAR(50) NOT NULL, -- Cash, Bank, Online
    [ReferenceNumber] NVARCHAR(100) NULL,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members]([Id]),
    FOREIGN KEY ([ChitGroupId]) REFERENCES [dbo].[ChitGroups]([Id]),
    FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets]([Id]),
    -- FK Removed for Split DB
);
GO

