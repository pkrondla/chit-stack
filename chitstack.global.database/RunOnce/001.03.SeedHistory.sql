CREATE TABLE [dbo].[SeedHistory] (
    [SeedKey] NVARCHAR(200) NOT NULL PRIMARY KEY,
    [AppliedAt] DATETIME2 NOT NULL CONSTRAINT [DF_GlobalSeedHistory_AppliedAt] DEFAULT GETUTCDATE(),
    [AppliedBy] NVARCHAR(200) NOT NULL CONSTRAINT [DF_GlobalSeedHistory_AppliedBy] DEFAULT N'System',
    [Notes] NVARCHAR(MAX) NULL
);
GO
