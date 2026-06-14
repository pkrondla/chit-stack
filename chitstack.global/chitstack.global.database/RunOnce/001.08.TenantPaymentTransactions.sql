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
    [CreatedAt]            DATETIME2      NOT NULL CONSTRAINT [DF_PT_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy]            NVARCHAR(200)  NULL,
    [LastModifiedAt]       DATETIME2      NULL,
    [LastModifiedBy]       NVARCHAR(200)  NULL,
    [IsActive]             BIT            NOT NULL CONSTRAINT [DF_PT_IsActive]  DEFAULT 1
);
GO
