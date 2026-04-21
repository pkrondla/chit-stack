CREATE TABLE [dbo].[UserNotificationSettings] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [UserId] INT NOT NULL,
    [InPortalEnabled] BIT NOT NULL CONSTRAINT [DF_UserNotificationSettings_InPortalEnabled] DEFAULT 1,
    [WhatsAppEnabled] BIT NOT NULL CONSTRAINT [DF_UserNotificationSettings_WhatsAppEnabled] DEFAULT 0,
    [SmsEnabled] BIT NOT NULL CONSTRAINT [DF_UserNotificationSettings_SmsEnabled] DEFAULT 0,
    [EmailEnabled] BIT NOT NULL CONSTRAINT [DF_UserNotificationSettings_EmailEnabled] DEFAULT 0,
    [PaymentRemindersEnabled] BIT NOT NULL CONSTRAINT [DF_UserNotificationSettings_PaymentRemindersEnabled] DEFAULT 1,
    [AuctionRemindersEnabled] BIT NOT NULL CONSTRAINT [DF_UserNotificationSettings_AuctionRemindersEnabled] DEFAULT 1,
    [TenantId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_UserNotificationSettings_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_UserNotificationSettings_IsActive] DEFAULT 1,
    CONSTRAINT [FK_UserNotificationSettings_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id])
);
GO

CREATE INDEX [IX_UserNotificationSettings_UserId] ON [dbo].[UserNotificationSettings]([UserId]);
GO
