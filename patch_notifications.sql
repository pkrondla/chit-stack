USE ChitLedgerTenant;
GO
-- Add columns to Members table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Members]') AND name = 'InPortalEnabled') 
    ALTER TABLE [Members] ADD [InPortalEnabled] BIT NOT NULL DEFAULT 1;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Members]') AND name = 'WhatsAppEnabled') 
    ALTER TABLE [Members] ADD [WhatsAppEnabled] BIT NOT NULL DEFAULT 1;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Members]') AND name = 'SmsEnabled') 
    ALTER TABLE [Members] ADD [SmsEnabled] BIT NOT NULL DEFAULT 1;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Members]') AND name = 'EmailEnabled') 
    ALTER TABLE [Members] ADD [EmailEnabled] BIT NOT NULL DEFAULT 1;
GO

-- Add columns to Notifications if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Notifications]') AND name = 'TemplateName') 
    ALTER TABLE [Notifications] ADD [TemplateName] NVARCHAR(MAX);
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Notifications]') AND name = 'ChannelsSent') 
    ALTER TABLE [Notifications] ADD [ChannelsSent] NVARCHAR(MAX);
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Notifications]') AND name = 'MemberId') 
    ALTER TABLE [Notifications] ADD [MemberId] INT NULL;
GO
ALTER TABLE [Notifications] ALTER COLUMN [UserId] INT NULL;
GO
 	
