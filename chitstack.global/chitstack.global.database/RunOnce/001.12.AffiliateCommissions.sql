CREATE TABLE [dbo].[AffiliateCommissions] (
    [Id]                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AffiliateId]       INT           NOT NULL REFERENCES [dbo].[Affiliates]([Id]),
    [TenantOrderId]     INT           NOT NULL REFERENCES [dbo].[TenantOrders]([Id]),
    [OrderAmount]       DECIMAL(18,2) NOT NULL,
    [CommissionPercent] DECIMAL(5,2)  NOT NULL,
    [CommissionAmount]  DECIMAL(18,2) NOT NULL,
    [Status]            NVARCHAR(20)  NOT NULL CONSTRAINT [DF_AffComm_Status]    DEFAULT N'Pending', -- Pending/Paid
    [PayoutId]          INT           NULL REFERENCES [dbo].[AffiliatePayouts]([Id]),
    [PaidAt]            DATETIME2     NULL,
    -- Audit
    [CreatedAt]         DATETIME2     NOT NULL CONSTRAINT [DF_AffComm_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy]         NVARCHAR(200) NULL,
    [LastModifiedAt]    DATETIME2     NULL,
    [LastModifiedBy]    NVARCHAR(200) NULL,
    [IsActive]          BIT           NOT NULL CONSTRAINT [DF_AffComm_IsActive]  DEFAULT 1
);
GO

CREATE INDEX [IX_AffiliateCommissions_AffiliateId]   ON [dbo].[AffiliateCommissions]([AffiliateId]);
GO

CREATE UNIQUE INDEX [IX_AffiliateCommissions_OrderId] ON [dbo].[AffiliateCommissions]([TenantOrderId]);
GO
