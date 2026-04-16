CREATE TABLE [dbo].[Notifications] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Title] NVARCHAR(200) NOT NULL,
    [Message] NVARCHAR(MAX) NOT NULL,
    [Type] INT NOT NULL,
    [UserId] INT NULL,
    [MemberId] INT NULL,
    [TemplateName] NVARCHAR(100) NULL,
    [ActionUrl] NVARCHAR(MAX) NULL,
    [ChannelsSent] NVARCHAR(MAX) NULL,
    [IsRead] BIT NOT NULL CONSTRAINT [DF_Notifications_IsRead] DEFAULT 0,
    [TenantId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Notifications_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Notifications_IsActive] DEFAULT 1,
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id])
);
GO

CREATE INDEX [IX_Notifications_UserId] ON [dbo].[Notifications]([UserId]);
GO
