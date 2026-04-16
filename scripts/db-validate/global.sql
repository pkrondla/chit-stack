:setvar DbName "ChitStack_Global_Validate"

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

:r ChitStack.Database.Global\RunOnce\001.01.Tenants.sql
:r ChitStack.Database.Global\RunOnce\001.02.Users.sql
:r ChitStack.Database.Global\RunOnce\001.03.SeedHistory.sql

:r ChitStack.Database.Global\PostDeploy.sql

-- Re-run PostDeploy to confirm idempotent seeds
:r ChitStack.Database.Global\PostDeploy.sql

SELECT COUNT(*) AS TenantCount FROM [dbo].[Tenants];
GO
