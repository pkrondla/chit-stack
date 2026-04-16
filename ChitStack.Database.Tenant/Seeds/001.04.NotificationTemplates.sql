DECLARE @TenantId INT;
SELECT TOP (1) @TenantId = [Id] FROM [dbo].[Tenants] ORDER BY [Id];

IF @TenantId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[NotificationTemplates] WHERE [TenantId] = @TenantId AND [Name] = N'ReceiptConfirmation')
    BEGIN
        INSERT INTO [dbo].[NotificationTemplates] (
            [TenantId],
            [Name],
            [TitleTemplate],
            [MessageTemplate],
            [Placeholders],
            [IsEnabled],
            [CreatedBy]
        )
        VALUES (
            @TenantId,
            N'ReceiptConfirmation',
            N'Payment Received: {Amount}',
            N'Dear {MemberName}, we have received your payment of {Amount} for {ChitGroup}. Your current balance is {Balance}. Receipt No: {ReceiptNo}.',
            N'{MemberName}, {Amount}, {ChitGroup}, {Balance}, {ReceiptNo}',
            1,
            N'System'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[NotificationTemplates] WHERE [TenantId] = @TenantId AND [Name] = N'AuctionWinner')
    BEGIN
        INSERT INTO [dbo].[NotificationTemplates] (
            [TenantId],
            [Name],
            [TitleTemplate],
            [MessageTemplate],
            [Placeholders],
            [IsEnabled],
            [CreatedBy]
        )
        VALUES (
            @TenantId,
            N'AuctionWinner',
            N'Congratulations! You won the Auction',
            N'Dear {MemberName}, you have successfully won the auction for {ChitGroup} (Inst {InstallmentNo}) with a bid of {BidAmount}.',
            N'{MemberName}, {ChitGroup}, {InstallmentNo}, {BidAmount}',
            1,
            N'System'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[NotificationTemplates] WHERE [TenantId] = @TenantId AND [Name] = N'DemandAlert')
    BEGIN
        INSERT INTO [dbo].[NotificationTemplates] (
            [TenantId],
            [Name],
            [TitleTemplate],
            [MessageTemplate],
            [Placeholders],
            [IsEnabled],
            [CreatedBy]
        )
        VALUES (
            @TenantId,
            N'DemandAlert',
            N'Installment Due: {ChitGroup}',
            N'Dear {MemberName}, installment of {Amount} for {ChitGroup} is due on {DueDate}. Please pay to avoid penalties.',
            N'{MemberName}, {Amount}, {ChitGroup}, {DueDate}',
            1,
            N'System'
        );
    END;
END;
GO
