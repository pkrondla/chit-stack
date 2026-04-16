:setvar DbName "ChitStack_Tenant_Validate"

USE [master];
GO

IF DB_ID('$(DbName)') IS NOT NULL
BEGIN
    ALTER DATABASE [$(DbName)] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [$(DbName)];
END;
GO

CREATE DATABASE [$(DbName)];
GO

USE [$(DbName)];
GO

-- Baseline schema (RunOnce)
:r ChitStack.Database.Tenant\RunOnce\001.01.Tenants.sql
:r ChitStack.Database.Tenant\RunOnce\001.02a.Branches.sql
:r ChitStack.Database.Tenant\RunOnce\001.02.Users.sql
:r ChitStack.Database.Tenant\RunOnce\001.02b.UserBranches.sql
:r ChitStack.Database.Tenant\RunOnce\001.03.ChitGroups.sql
:r ChitStack.Database.Tenant\RunOnce\001.04.Members.sql
:r ChitStack.Database.Tenant\RunOnce\001.05.Tickets.sql
:r ChitStack.Database.Tenant\RunOnce\001.06.Auctions.sql
:r ChitStack.Database.Tenant\RunOnce\001.07.AccountHeads.sql
:r ChitStack.Database.Tenant\RunOnce\001.08.JournalEntries.sql
:r ChitStack.Database.Tenant\RunOnce\001.09.JournalEntryLines.sql
:r ChitStack.Database.Tenant\RunOnce\001.10.Receipts.sql
:r ChitStack.Database.Tenant\RunOnce\001.11.Demands.sql
:r ChitStack.Database.Tenant\RunOnce\001.12.Guarantors.sql
:r ChitStack.Database.Tenant\RunOnce\001.13.Nominees.sql
:r ChitStack.Database.Tenant\RunOnce\001.14.TenantSettings.sql
:r ChitStack.Database.Tenant\RunOnce\001.15.HolidayDates.sql
:r ChitStack.Database.Tenant\RunOnce\001.16.AuctionAttendances.sql
:r ChitStack.Database.Tenant\RunOnce\001.17.AuctionBids.sql
:r ChitStack.Database.Tenant\RunOnce\001.18.CollectionRoutes.sql
:r ChitStack.Database.Tenant\RunOnce\001.19.CollectionSubmissions.sql
:r ChitStack.Database.Tenant\RunOnce\001.20.Notifications.sql
:r ChitStack.Database.Tenant\RunOnce\001.21.UserNotificationSettings.sql
:r ChitStack.Database.Tenant\RunOnce\001.22.NotificationTemplates.sql
:r ChitStack.Database.Tenant\RunOnce\001.23.AuditLogs.sql
:r ChitStack.Database.Tenant\RunOnce\001.24.SeedHistory.sql
:r ChitStack.Database.Tenant\RunOnce\001.99.ForeignKeys.sql

-- Baseline seeds (PostDeploy)
:r ChitStack.Database.Tenant\PostDeploy.sql

-- Re-run PostDeploy to confirm idempotent seeds
:r ChitStack.Database.Tenant\PostDeploy.sql

SELECT COUNT(*) AS TenantCount FROM [dbo].[Tenants];
SELECT COUNT(*) AS BranchCount FROM [dbo].[Branches];
SELECT COUNT(*) AS TemplateCount FROM [dbo].[NotificationTemplates];
SELECT COUNT(*) AS AccountCount FROM [dbo].[AccountHeads];
GO
