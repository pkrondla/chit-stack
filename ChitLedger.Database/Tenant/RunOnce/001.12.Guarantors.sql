CREATE TABLE [dbo].[Guarantors] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(200) NOT NULL,
    [Mobile] NVARCHAR(20) NOT NULL,
    [KycDocument] NVARCHAR(MAX) NULL,
    [MemberId] INT NULL, -- Linked to Member? Or Ticket? Usually Ticket or Member.
                         -- Code: public int TicketId { get; set; }
    [TicketId] INT NOT NULL,
    [TenantId] INT NOT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets]([Id]),
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id])
);
GO
