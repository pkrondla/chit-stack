CREATE TABLE [dbo].[NotificationTemplates] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL,
    [TitleTemplate] NVARCHAR(MAX) NOT NULL,
    [MessageTemplate] NVARCHAR(MAX) NOT NULL,
    [WhatsAppTemplate] NVARCHAR(MAX) NULL,
    [SmsTemplate] NVARCHAR(MAX) NULL,
    [EmailHtmlTemplate] NVARCHAR(MAX) NULL,
    [IsEnabled] BIT NOT NULL CONSTRAINT [DF_NotificationTemplates_IsEnabled] DEFAULT 1,
    [Placeholders] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_NotificationTemplates_Placeholders] DEFAULT N'',
    [TenantId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_NotificationTemplates_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_NotificationTemplates_IsActive] DEFAULT 1
);
GO
