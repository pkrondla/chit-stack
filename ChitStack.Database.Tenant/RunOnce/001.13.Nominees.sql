CREATE TABLE [dbo].[Nominees] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(200) NOT NULL,
    [Relationship] NVARCHAR(50) NOT NULL,
    [Mobile] NVARCHAR(20) NULL,
    [MemberId] INT NOT NULL,
    [TenantId] INT NOT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members]([Id]),
    -- FK Removed for Split DB
);
GO

