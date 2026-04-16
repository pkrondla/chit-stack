CREATE TABLE [dbo].[Tickets] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TicketNumber] INT NOT NULL,
    [ChitGroupId] INT NOT NULL,
    [MemberId] INT NULL,
    [IsPrized] BIT NOT NULL DEFAULT 0,
    [PrizedInstallment] INT NULL,
    [Status] INT NOT NULL CONSTRAINT [DF_Tickets_Status] DEFAULT 0,
    [IsForeman] BIT NOT NULL CONSTRAINT [DF_Tickets_IsForeman] DEFAULT 0,
    [AdvanceBalance] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Tickets_AdvanceBalance] DEFAULT 0,
    [RemovalDate] DATETIME2 NULL,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Tickets_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Tickets_IsActive] DEFAULT 1,
    CONSTRAINT [FK_Tickets_ChitGroups_ChitGroupId] FOREIGN KEY ([ChitGroupId]) REFERENCES [dbo].[ChitGroups]([Id]),
    CONSTRAINT [FK_Tickets_Members_MemberId] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members]([Id])
);
GO

CREATE UNIQUE INDEX [IX_Tickets_ChitGroupId_TicketNumber] ON [dbo].[Tickets]([ChitGroupId], [TicketNumber]);
GO

CREATE INDEX [IX_Tickets_MemberId] ON [dbo].[Tickets]([MemberId]);
GO

