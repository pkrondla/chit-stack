CREATE TABLE [dbo].[Users] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Username] NVARCHAR(100) NOT NULL,
    [PasswordHash] NVARCHAR(MAX) NOT NULL,
    [Email] NVARCHAR(200) NOT NULL,
    [FullName] NVARCHAR(200) NOT NULL,
    [Role] NVARCHAR(50) NOT NULL CONSTRAINT [DF_Users_Role] DEFAULT N'Staff',
    [MemberId] INT NULL,
    [AssignedRouteId] INT NULL,
    [LastLatitude] DECIMAL(18,6) NULL,
    [LastLongitude] DECIMAL(18,6) NULL,
    [LastLocationUpdateTime] DATETIME2 NULL,
    [TenantId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Users_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive]       BIT       NOT NULL CONSTRAINT [DF_Users_IsActive] DEFAULT 1,
    [TrialEndDate]   DATETIME2 NULL  -- Demo stamp only; NULL on dedicated tenant stamps
);
GO

CREATE INDEX [IX_Users_MemberId] ON [dbo].[Users]([MemberId]);
GO

CREATE INDEX [IX_Users_AssignedRouteId] ON [dbo].[Users]([AssignedRouteId]);
GO
