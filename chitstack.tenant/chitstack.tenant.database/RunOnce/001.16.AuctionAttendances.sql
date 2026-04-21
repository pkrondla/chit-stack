CREATE TABLE [dbo].[AuctionAttendances] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AuctionId] INT NOT NULL,
    [TicketId] INT NOT NULL,
    [AttendanceTime] DATETIME2 NULL,
    [IsPresent] BIT NOT NULL CONSTRAINT [DF_AuctionAttendances_IsPresent] DEFAULT 0,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_AuctionAttendances_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_AuctionAttendances_IsActive] DEFAULT 1,
    CONSTRAINT [FK_AuctionAttendances_Auctions_AuctionId] FOREIGN KEY ([AuctionId]) REFERENCES [dbo].[Auctions]([Id]),
    CONSTRAINT [FK_AuctionAttendances_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets]([Id])
);
GO

CREATE INDEX [IX_AuctionAttendances_AuctionId] ON [dbo].[AuctionAttendances]([AuctionId]);
GO

CREATE INDEX [IX_AuctionAttendances_TicketId] ON [dbo].[AuctionAttendances]([TicketId]);
GO
