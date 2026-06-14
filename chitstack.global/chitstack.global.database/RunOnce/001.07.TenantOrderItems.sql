CREATE TABLE [dbo].[TenantOrderItems] (
    [Id]                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [OrderId]           INT            NOT NULL REFERENCES [dbo].[TenantOrders]([Id]),
    [ComponentId]       INT            NOT NULL REFERENCES [dbo].[SoftwareComponents]([Id]),
    [ComponentName]     NVARCHAR(200)  NOT NULL,
    [ComponentCategory] NVARCHAR(50)   NOT NULL,
    [PricingType]       NVARCHAR(20)   NOT NULL,
    [UnitPrice]         DECIMAL(10,2)  NOT NULL,
    [EstimatedHours]    INT            NULL,
    [LineTotal]         DECIMAL(10,2)  NOT NULL,
    [CreatedAt]         DATETIME2      NOT NULL CONSTRAINT [DF_TOI_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy]         NVARCHAR(200)  NULL,
    [LastModifiedAt]    DATETIME2      NULL,
    [LastModifiedBy]    NVARCHAR(200)  NULL,
    [IsActive]          BIT            NOT NULL CONSTRAINT [DF_TOI_IsActive] DEFAULT 1
);
GO
