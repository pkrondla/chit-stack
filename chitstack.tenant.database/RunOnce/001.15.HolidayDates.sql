CREATE TABLE [dbo].[HolidayDates] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Date] DATE NOT NULL,
    [Description] NVARCHAR(200) NOT NULL,
    [IsRecurringYearly] BIT NOT NULL CONSTRAINT [DF_HolidayDates_IsRecurringYearly] DEFAULT 0,
    [TenantId] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_HolidayDates_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_HolidayDates_IsActive] DEFAULT 1
);
GO
