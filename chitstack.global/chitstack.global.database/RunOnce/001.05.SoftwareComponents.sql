CREATE TABLE [dbo].[SoftwareComponents] (
    [Id]               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name]             NVARCHAR(200)  NOT NULL,
    [Description]      NVARCHAR(1000) NULL,
    [Category]         NVARCHAR(50)   NOT NULL,   -- 'Core' | 'AddOn' | 'Service'
    [PricingType]      NVARCHAR(20)   NOT NULL,   -- 'Monthly' | 'License' | 'Hourly'
    [IsMandatory]      BIT            NOT NULL CONSTRAINT [DF_SC_Mandatory]  DEFAULT 0,
    [MonthlyPrice]     DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_SC_Monthly]    DEFAULT 0,
    [HalfYearlyPrice]  DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_SC_HalfYearly] DEFAULT 0,
    [AnnualPrice]      DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_SC_Annual]     DEFAULT 0,
    [LicensePrice]     DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_SC_License]    DEFAULT 0,
    [HourlyPrice]      DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_SC_Hourly]     DEFAULT 0,
    [DisplayOrder]     INT            NOT NULL DEFAULT 0,
    [IsActive]         BIT            NOT NULL CONSTRAINT [DF_SC_Active]     DEFAULT 1,
    [CreatedAt]        DATETIME2      NOT NULL CONSTRAINT [DF_SC_CreatedAt]  DEFAULT GETUTCDATE(),
    [CreatedBy]        NVARCHAR(200)  NULL,
    [LastModifiedAt]   DATETIME2      NULL,
    [LastModifiedBy]   NVARCHAR(200)  NULL
);
GO
