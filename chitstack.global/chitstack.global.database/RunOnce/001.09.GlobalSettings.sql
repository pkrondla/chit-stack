CREATE TABLE [dbo].[GlobalSettings] (
    [Id]             INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [SettingGroup]   NVARCHAR(50)   NOT NULL,
    [SettingKey]     NVARCHAR(100)  NOT NULL,
    [SettingValue]   NVARCHAR(MAX)  NULL,
    [Description]    NVARCHAR(500)  NULL,
    [IsSecret]       BIT            NOT NULL CONSTRAINT [DF_GS_IsSecret]  DEFAULT 0,
    [LastModifiedAt] DATETIME2      NULL,
    [LastModifiedBy] NVARCHAR(200)  NULL
);
GO

CREATE UNIQUE INDEX [IX_GlobalSettings_GroupKey] ON [dbo].[GlobalSettings]([SettingGroup], [SettingKey]);
GO
