CREATE TABLE [dbo].[Guarantors] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(200) NOT NULL,
    [PhoneNumber] NVARCHAR(20) NOT NULL,
    [AadhaarNumber] NVARCHAR(20) NOT NULL,
    [Occupation] NVARCHAR(100) NOT NULL,
    [AnnualIncome] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Guarantors_AnnualIncome] DEFAULT 0,
    [Relationship] NVARCHAR(100) NOT NULL,
    [TicketId] INT NOT NULL,
    [TenantId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Guarantors_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Guarantors_IsActive] DEFAULT 1,
    CONSTRAINT [FK_Guarantors_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets]([Id])
);
GO

CREATE INDEX [IX_Guarantors_TicketId] ON [dbo].[Guarantors]([TicketId]);
GO

