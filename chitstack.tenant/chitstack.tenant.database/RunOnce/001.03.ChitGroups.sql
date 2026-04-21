CREATE TABLE [dbo].[ChitGroups] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [GroupName] NVARCHAR(200) NOT NULL,
    [ChitValue] DECIMAL(18,2) NOT NULL,
    [DurationMonths] INT NOT NULL,
    [InstallmentAmount] DECIMAL(18,2) NOT NULL,
    [ForemanCommissionPercent] DECIMAL(18,2) NOT NULL,
    [LaunchDate] DATETIME2 NULL,
    [Status] INT NOT NULL,
    [LateFeePercent] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ChitGroups_LateFeePercent] DEFAULT 0,
    [GracePeriodDays] INT NOT NULL CONSTRAINT [DF_ChitGroups_GracePeriodDays] DEFAULT 0,
    [SanctionNumber] NVARCHAR(100) NULL,
    [SanctionDate] DATETIME2 NULL,
    [RegistrationNumber] NVARCHAR(100) NULL,
    [RegistrationDate] DATETIME2 NULL,
    [AuctionVenueAddress] NVARCHAR(500) NULL,
    [SecurityDepositBankName] NVARCHAR(200) NULL,
    [SecurityDepositBankBranch] NVARCHAR(200) NULL,
    [SecurityDepositFdrNumber] NVARCHAR(100) NULL,
    [SecurityDepositDate] DATETIME2 NULL,
    [FilingFees] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ChitGroups_FilingFees] DEFAULT 0,
    [AuctionScheduleMode] NVARCHAR(50) NULL,
    [AuctionDayOfMonth] NVARCHAR(20) NULL,
    [AuctionWeekNumber] INT NULL,
    [AuctionDayOfWeek] INT NULL,
    [AuctionTime] TIME NULL,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_ChitGroups_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_ChitGroups_IsActive] DEFAULT 1
);
GO

CREATE INDEX [IX_ChitGroups_BranchId] ON [dbo].[ChitGroups]([BranchId]);
GO

