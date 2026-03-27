-- SQL script to add Notification System features

-- 1. Create Notifications Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Notifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Notifications] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [UserId] INT NOT NULL,
        [Title] NVARCHAR(200) NOT NULL,
        [Message] NVARCHAR(MAX) NOT NULL,
        [Type] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [IsRead] BIT NOT NULL DEFAULT 0,
        [ActionUrl] NVARCHAR(500) NULL,
        [TenantId] INT NOT NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [LastModifiedAt] DATETIME2 NULL,
        [LastModifiedBy] NVARCHAR(100) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id])
    );
END

-- 2. Create UserNotificationSettings Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserNotificationSettings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[UserNotificationSettings] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [UserId] INT NOT NULL,
        [InPortalEnabled] BIT NOT NULL DEFAULT 1,
        [WhatsAppEnabled] BIT NOT NULL DEFAULT 0,
        [SmsEnabled] BIT NOT NULL DEFAULT 0,
        [EmailEnabled] BIT NOT NULL DEFAULT 0,
        [AuctionRemindersEnabled] BIT NOT NULL DEFAULT 1,
        [PaymentRemindersEnabled] BIT NOT NULL DEFAULT 1,
        [TenantId] INT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [CreatedBy] NVARCHAR(100) NULL,
        [LastModifiedAt] DATETIME2 NULL,
        [LastModifiedBy] NVARCHAR(100) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        CONSTRAINT [FK_UserNotificationSettings_Users] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id])
    );
END

-- 3. Add Notification settings to TenantSettings
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TenantSettings]') AND name = 'SmtpHost')
BEGIN
    ALTER TABLE [dbo].[TenantSettings] ADD 
        [SmtpHost] NVARCHAR(200) NULL,
        [SmtpPort] INT NULL,
        [SmtpUser] NVARCHAR(200) NULL,
        [SmtpPass] NVARCHAR(500) NULL,
        [EmailFrom] NVARCHAR(200) NULL,
        [WhatsAppApiUrl] NVARCHAR(500) NULL,
        [WhatsAppApiKey] NVARCHAR(500) NULL,
        [WhatsAppSenderNumber] NVARCHAR(50) NULL,
        [SmsApiUrl] NVARCHAR(500) NULL,
        [SmsApiKey] NVARCHAR(500) NULL,
        [SmsSenderId] NVARCHAR(50) NULL,
        [AutoPaymentRemindersEnabled] BIT NOT NULL DEFAULT 0,
        [PaymentReminderDaysBefore] INT NOT NULL DEFAULT 3,
        [AutoAuctionRemindersEnabled] BIT NOT NULL DEFAULT 0,
        [AuctionReminderHoursBefore] INT NOT NULL DEFAULT 24;
END
GO
