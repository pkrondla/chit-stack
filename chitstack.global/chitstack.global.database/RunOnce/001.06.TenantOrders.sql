CREATE TABLE [dbo].[TenantOrders] (
    [Id]               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [OrderReference]   NVARCHAR(20)   NOT NULL,
    [TenantId]         INT            NOT NULL REFERENCES [dbo].[Tenants]([Id]),
    [CompanyName]      NVARCHAR(200)  NOT NULL,
    [TenantKey]        NVARCHAR(100)  NOT NULL,
    [AdminName]        NVARCHAR(200)  NOT NULL,
    [AdminEmail]       NVARCHAR(200)  NOT NULL,
    [AdminPhone]       NVARCHAR(50)   NULL,
    [State]            NVARCHAR(100)  NOT NULL CONSTRAINT [DF_TO_State]         DEFAULT N'Karnataka',
    [BillingPeriod]    NVARCHAR(20)   NOT NULL,
    [RecurringTotal]   DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_TO_RecurringTotal] DEFAULT 0,
    [OneTimeTotal]     DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_TO_OneTimeTotal]   DEFAULT 0,
    [ServiceTotal]     DECIMAL(10,2)  NOT NULL CONSTRAINT [DF_TO_ServiceTotal]   DEFAULT 0,
    [TotalAmount]      DECIMAL(10,2)  NOT NULL,
    [OrderStatus]      NVARCHAR(50)   NOT NULL CONSTRAINT [DF_TO_Status]        DEFAULT N'Submitted',
    [Notes]            NVARCHAR(MAX)  NULL,
    [ConnectionString] NVARCHAR(MAX)  NULL,
    [CreatedAt]        DATETIME2      NOT NULL CONSTRAINT [DF_TO_CreatedAt]     DEFAULT GETUTCDATE(),
    [CreatedBy]        NVARCHAR(200)  NULL,
    [LastModifiedAt]   DATETIME2      NULL,
    [LastModifiedBy]   NVARCHAR(200)  NULL,
    [ConfirmedAt]      DATETIME2      NULL,
    [ProvisionedAt]    DATETIME2      NULL,
    [IsActive]         BIT            NOT NULL CONSTRAINT [DF_TO_IsActive]      DEFAULT 1
);
GO

CREATE UNIQUE INDEX [IX_TenantOrders_Ref] ON [dbo].[TenantOrders]([OrderReference]);
GO
