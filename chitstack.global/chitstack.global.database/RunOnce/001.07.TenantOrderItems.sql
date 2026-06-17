CREATE TABLE [dbo].[TenantOrderItems] (
    [Id]                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [OrderId]           INT            NOT NULL REFERENCES [dbo].[TenantOrders]([Id]),
    [ComponentId]       INT            NOT NULL REFERENCES [dbo].[SoftwareComponents]([Id]),
    [ComponentName]     NVARCHAR(200)  NOT NULL,
    [ComponentCategory] NVARCHAR(50)   NOT NULL,
    [PricingType]       NVARCHAR(20)   NOT NULL,   -- 'License' | 'Annual' | 'PerDay' | 'AMC'
    [UnitPrice]         DECIMAL(10,2)  NOT NULL,
    [Quantity]          INT            NOT NULL CONSTRAINT [DF_TOI_Qty]      DEFAULT 1,   -- days for PerDay, 1 otherwise
    [LineTotal]         DECIMAL(10,2)  NOT NULL,
    [ExpiryDate]        DATETIME2      NULL,        -- set for Annual/AMC items; NULL for License/PerDay
    [CreatedAt]         DATETIME2      NOT NULL CONSTRAINT [DF_TOI_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy]         NVARCHAR(200)  NULL,
    [LastModifiedAt]    DATETIME2      NULL,
    [LastModifiedBy]    NVARCHAR(200)  NULL,
    [IsActive]          BIT            NOT NULL CONSTRAINT [DF_TOI_IsActive] DEFAULT 1
);
GO
