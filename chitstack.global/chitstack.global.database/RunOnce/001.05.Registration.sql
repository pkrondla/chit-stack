-- ============================================================
-- 001.05.Registration.sql
-- Self-registration & subscription order support
-- ============================================================

-- 1. Extend Tenants table with registration / trial fields
ALTER TABLE [dbo].[Tenants]
    ADD [SubscriptionStatus] NVARCHAR(50)  NOT NULL CONSTRAINT [DF_T_Status]    DEFAULT N'DemoAccess',
        [TrialStartDate]     DATETIME2     NOT NULL CONSTRAINT [DF_T_TrialStart] DEFAULT GETUTCDATE(),
        [TrialEndDate]       DATETIME2     NOT NULL CONSTRAINT [DF_T_TrialEnd]   DEFAULT DATEADD(DAY, 30, GETUTCDATE()),
        [ContactEmail]       NVARCHAR(200) NOT NULL CONSTRAINT [DF_T_Email]      DEFAULT N'',
        [ContactPhone]       NVARCHAR(50)  NULL,
        [ProvisionedAt]      DATETIME2     NULL;
GO

CREATE INDEX [IX_GlobalTenants_Email] ON [dbo].[Tenants]([ContactEmail]);
GO

-- Any previously provisioned tenant (has Subdomain + ConnectionString) is 'Active'
UPDATE [dbo].[Tenants]
   SET [SubscriptionStatus] = N'Active',
       [ProvisionedAt]      = [CreatedAt]
 WHERE [ConnectionString] <> N'' AND [Subdomain] <> N'';
GO

-- 2. SoftwareComponents — product catalogue
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
    [LastModifiedAt]   DATETIME2      NULL
);
GO

INSERT INTO [dbo].[SoftwareComponents]
    ([Name], [Category], [PricingType], [IsMandatory],
     [MonthlyPrice], [HalfYearlyPrice], [AnnualPrice], [LicensePrice], [HourlyPrice], [DisplayOrder])
VALUES
    ('Chit Fund Management Software',    'Core',    'Monthly', 1,  999.00, 4999.00,  8999.00, 0,       0,      1),
    ('WhatsApp Notifications',           'AddOn',   'Monthly', 0,  299.00, 1499.00,  2499.00, 0,       0,      2),
    ('SMS Notifications',                'AddOn',   'Monthly', 0,  199.00,  999.00,  1699.00, 0,       0,      3),
    ('Telegram Notifications',           'AddOn',   'Monthly', 0,  149.00,  749.00,  1299.00, 0,       0,      4),
    ('Android Mobile App',               'AddOn',   'License', 0,    0,       0,        0,    4999.00, 0,      5),
    ('iOS Mobile App',                   'AddOn',   'License', 0,    0,       0,        0,    4999.00, 0,      6),
    ('Customer Support (Business Hours)','Service', 'Monthly', 0,  499.00, 2499.00,  3999.00, 0,       0,      7),
    ('Customer Support (Extended Hours)','Service', 'Monthly', 0,  799.00, 3999.00,  6999.00, 0,       0,      8),
    ('Custom Development',               'Service', 'Hourly',  0,    0,       0,        0,    0,       500.00, 9),
    ('Data Migration / Setup',           'Service', 'Hourly',  0,    0,       0,        0,    0,       300.00, 10);
GO

-- 3. TenantOrders — subscription order submissions
CREATE TABLE [dbo].[TenantOrders] (
    [Id]               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [OrderReference]   NVARCHAR(20)   NOT NULL,
    [TenantId]         INT            NOT NULL REFERENCES [dbo].[Tenants]([Id]),
    [CompanyName]      NVARCHAR(200)  NOT NULL,
    [TenantKey]        NVARCHAR(100)  NOT NULL,
    [AdminName]        NVARCHAR(200)  NOT NULL,
    [AdminEmail]       NVARCHAR(200)  NOT NULL,
    [AdminPhone]       NVARCHAR(50)   NULL,
    [State]            NVARCHAR(100)  NOT NULL CONSTRAINT [DF_TO_State] DEFAULT N'Karnataka',
    [BillingPeriod]    NVARCHAR(20)   NOT NULL,
    [RecurringTotal]   DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_TO_RecurringTotal] DEFAULT 0,
    [OneTimeTotal]     DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_TO_OneTimeTotal]   DEFAULT 0,
    [ServiceTotal]     DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_TO_ServiceTotal]   DEFAULT 0,
    [TotalAmount]      DECIMAL(10,2)  NOT NULL,
    [OrderStatus]      NVARCHAR(50)   NOT NULL CONSTRAINT [DF_TO_Status]    DEFAULT N'Submitted',
    [Notes]            NVARCHAR(MAX)  NULL,
    [ConnectionString] NVARCHAR(MAX)  NULL,
    [CreatedAt]        DATETIME2      NOT NULL CONSTRAINT [DF_TO_CreatedAt] DEFAULT GETUTCDATE(),
    [ConfirmedAt]      DATETIME2      NULL,
    [ProvisionedAt]    DATETIME2      NULL
);
GO

CREATE UNIQUE INDEX [IX_TenantOrders_Ref] ON [dbo].[TenantOrders]([OrderReference]);
GO

-- 4. TenantOrderItems — line items
CREATE TABLE [dbo].[TenantOrderItems] (
    [Id]                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [OrderId]           INT            NOT NULL REFERENCES [dbo].[TenantOrders]([Id]),
    [ComponentId]       INT            NOT NULL REFERENCES [dbo].[SoftwareComponents]([Id]),
    [ComponentName]     NVARCHAR(200)  NOT NULL,
    [ComponentCategory] NVARCHAR(50)   NOT NULL,
    [PricingType]       NVARCHAR(20)   NOT NULL,
    [UnitPrice]         DECIMAL(10,2)  NOT NULL,
    [EstimatedHours]    INT            NULL,
    [LineTotal]         DECIMAL(10,2)  NOT NULL
);
GO

-- 5. TenantPaymentTransactions — manual payment tracking
CREATE TABLE [dbo].[TenantPaymentTransactions] (
    [Id]                   INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [OrderId]              INT            NOT NULL REFERENCES [dbo].[TenantOrders]([Id]),
    [TransactionReference] NVARCHAR(200)  NOT NULL,
    [PaymentDate]          DATE           NOT NULL,
    [Amount]               DECIMAL(10,2)  NOT NULL,
    [PaymentMethod]        NVARCHAR(50)   NOT NULL,
    [BankOrUpiDetails]     NVARCHAR(500)  NULL,
    [UpdatedBy]            NVARCHAR(200)  NOT NULL,
    [UpdatedByRole]        NVARCHAR(20)   NOT NULL,
    [Status]               NVARCHAR(20)   NOT NULL CONSTRAINT [DF_PT_Status]    DEFAULT N'Pending',
    [ConfirmedBy]          NVARCHAR(200)  NULL,
    [ConfirmedAt]          DATETIME2      NULL,
    [RejectionReason]      NVARCHAR(500)  NULL,
    [CreatedAt]            DATETIME2      NOT NULL CONSTRAINT [DF_PT_CreatedAt] DEFAULT GETUTCDATE()
);
GO
