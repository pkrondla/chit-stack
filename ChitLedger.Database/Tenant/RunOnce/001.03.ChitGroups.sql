CREATE TABLE [dbo].[ChitGroups] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(200) NOT NULL,
    [Code] NVARCHAR(50) NOT NULL,
    [ChitValue] DECIMAL(18,2) NOT NULL,
    [DurationMonths] INT NOT NULL,
    [MonthlySubscription] DECIMAL(18,2) NOT NULL,
    [ForemanCommissionPercent] DECIMAL(5,2) NOT NULL,
    [LaunchDate] DATETIME2 NULL,
    [Status] INT NOT NULL, -- Enum: 0=Proposed, 1=Active, 2=Completed, 3=Closed
    [TenantId] INT NOT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    -- FK Removed for Split DB
);
GO

