DECLARE @TenantId INT;
SELECT TOP (1) @TenantId = [Id] FROM [dbo].[Tenants] ORDER BY [Id];

IF @TenantId IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM [dbo].[TenantSettings] WHERE [TenantId] = @TenantId)
BEGIN
    INSERT INTO [dbo].[TenantSettings] (
        [TenantId],
        [CompanyName],
        [RegistrationNumber],
        [RegisteredOfficeAddress],
        [ForemanName],
        [ForemanDesignation],
        [PhoneNumber],
        [Email],
        [MaxBiddingDiscountPercent],
        [DefaultLateFeePercent],
        [DefaultGracePeriodDays],
        [AutoPaymentRemindersEnabled],
        [PaymentReminderDaysBefore],
        [NotifyOnReceipt],
        [NotifyOnAuctionWon],
        [NotifyOnDemand],
        [NotifyOnReconciliation],
        [NotifyOnPayout],
        [CreatedBy]
    )
    VALUES (
        @TenantId,
        N'ChitStack Demo',
        N'DEMO-12345',
        N'123 Demo Street, Cloud City',
        N'System',
        N'Authorized Signatory',
        N'',
        N'',
        40,
        2,
        5,
        1,
        3,
        1,
        1,
        1,
        1,
        1,
        N'System'
    );
END;
GO
