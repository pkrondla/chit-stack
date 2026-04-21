CREATE TABLE [dbo].[CollectionSubmissions] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AgentId] INT NOT NULL,
    [SubmissionDate] DATETIME2 NOT NULL,
    [TotalAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_CollectionSubmissions_TotalAmount] DEFAULT 0,
    [TotalCash] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_CollectionSubmissions_TotalCash] DEFAULT 0,
    [TotalCheque] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_CollectionSubmissions_TotalCheque] DEFAULT 0,
    [Status] NVARCHAR(50) NOT NULL CONSTRAINT [DF_CollectionSubmissions_Status] DEFAULT N'Pending',
    [VerifiedByUserId] INT NULL,
    [VerifiedById] INT NULL,
    [VerifiedAt] DATETIME2 NULL,
    [Remarks] NVARCHAR(MAX) NULL,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_CollectionSubmissions_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_CollectionSubmissions_IsActive] DEFAULT 1,
    CONSTRAINT [FK_CollectionSubmissions_Users_AgentId] FOREIGN KEY ([AgentId]) REFERENCES [dbo].[Users]([Id]),
    CONSTRAINT [FK_CollectionSubmissions_Users_VerifiedById] FOREIGN KEY ([VerifiedById]) REFERENCES [dbo].[Users]([Id])
);
GO

CREATE INDEX [IX_CollectionSubmissions_AgentId] ON [dbo].[CollectionSubmissions]([AgentId]);
GO

CREATE INDEX [IX_CollectionSubmissions_VerifiedById] ON [dbo].[CollectionSubmissions]([VerifiedById]);
GO
