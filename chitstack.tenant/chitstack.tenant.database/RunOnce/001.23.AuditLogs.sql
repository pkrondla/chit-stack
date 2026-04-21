CREATE TABLE [dbo].[AuditLogs] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [EntityName] NVARCHAR(200) NOT NULL,
    [EntityId] INT NOT NULL,
    [Action] NVARCHAR(50) NOT NULL,
    [DataBefore] NVARCHAR(MAX) NULL,
    [DataAfter] NVARCHAR(MAX) NULL,
    [UserId] NVARCHAR(200) NULL,
    [Timestamp] DATETIME2 NOT NULL,
    [TenantId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_AuditLogs_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_AuditLogs_IsActive] DEFAULT 1
);
GO
