CREATE TABLE [dbo].[AffiliatePayouts] (
    [Id]               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [AffiliateId]      INT           NOT NULL REFERENCES [dbo].[Affiliates]([Id]),
    [Amount]           DECIMAL(18,2) NOT NULL,
    [PaymentMethod]    NVARCHAR(50)  NOT NULL,  -- UPI/Bank/Cash/Cheque
    [PaymentReference] NVARCHAR(200) NULL,
    [Notes]            NVARCHAR(500) NULL,
    [Status]           NVARCHAR(20)  NOT NULL CONSTRAINT [DF_AffPayout_Status] DEFAULT N'Completed',
    -- Audit
    [CreatedAt]        DATETIME2     NOT NULL CONSTRAINT [DF_AffPayout_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy]        NVARCHAR(200) NULL,
    [LastModifiedAt]   DATETIME2     NULL,
    [LastModifiedBy]   NVARCHAR(200) NULL,
    [IsActive]         BIT           NOT NULL CONSTRAINT [DF_AffPayout_IsActive] DEFAULT 1
);
GO

CREATE INDEX [IX_AffiliatePayouts_AffiliateId] ON [dbo].[AffiliatePayouts]([AffiliateId]);
GO
