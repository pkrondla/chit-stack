CREATE TABLE [dbo].[Tickets] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [TicketNumber] INT NOT NULL,
    [ChitGroupId] INT NOT NULL,
    [MemberId] INT NOT NULL,
    [IsPrized] BIT NOT NULL DEFAULT 0,
    [PrizedInstallment] INT NULL,
    [Status] NVARCHAR(50) DEFAULT 'Active',
    [TenantId] INT NOT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([ChitGroupId]) REFERENCES [dbo].[ChitGroups]([Id]),
    FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members]([Id]),
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id])
);
GO
