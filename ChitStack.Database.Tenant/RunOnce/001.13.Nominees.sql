CREATE TABLE [dbo].[Nominees] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [FullName] NVARCHAR(200) NOT NULL,
    [Relationship] NVARCHAR(50) NOT NULL,
    [DateOfBirth] DATETIME2 NOT NULL,
    [AadhaarNumber] NVARCHAR(20) NULL,
    [PhoneNumber] NVARCHAR(20) NULL,
    [GuardianName] NVARCHAR(200) NULL,
    [GuardianRelationship] NVARCHAR(50) NULL,
    [TicketId] INT NOT NULL,
    [TenantId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Nominees_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Nominees_IsActive] DEFAULT 1,
    CONSTRAINT [FK_Nominees_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets]([Id])
);
GO

CREATE INDEX [IX_Nominees_TicketId] ON [dbo].[Nominees]([TicketId]);
GO

