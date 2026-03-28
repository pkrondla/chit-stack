USE [ChitLedgerTenant];
GO

-- 1. Create NotificationTemplates Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NotificationTemplates')
BEGIN
    CREATE TABLE NotificationTemplates (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TenantId INT DEFAULT 1,
        Name NVARCHAR(100) NOT NULL,
        TitleTemplate NVARCHAR(200) NOT NULL,
        MessageTemplate NVARCHAR(MAX) NOT NULL,
        IsEnabled BIT DEFAULT 1,
        Placeholders NVARCHAR(500) DEFAULT '',
        CreatedBy NVARCHAR(100) DEFAULT 'System',
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        LastModifiedBy NVARCHAR(100) NULL,
        LastModifiedAt DATETIME2 NULL
    );
END
GO

-- 2. Add columns to TenantSettings
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TenantSettings') AND name = 'NotifyOnReceipt')
BEGIN
    ALTER TABLE TenantSettings ADD NotifyOnReceipt BIT DEFAULT 1;
    ALTER TABLE TenantSettings ADD NotifyOnAuctionWon BIT DEFAULT 1;
    ALTER TABLE TenantSettings ADD NotifyOnDividend BIT DEFAULT 0;
    ALTER TABLE TenantSettings ADD NotifyOnDemand BIT DEFAULT 1;
    ALTER TABLE TenantSettings ADD NotifyOnReconciliation BIT DEFAULT 1;
    ALTER TABLE TenantSettings ADD NotifyOnPayout BIT DEFAULT 1;
END
GO

-- 3. Seed Default Templates (if empty)
IF NOT EXISTS (SELECT * FROM NotificationTemplates)
BEGIN
    INSERT INTO NotificationTemplates (Name, TitleTemplate, MessageTemplate, Placeholders)
    VALUES 
    ('ReceiptConfirmation', 'Payment Received', 'Dear {MemberName}, we received ₹{Amount} for {ChitGroup}. Balance: ₹{Balance}. Receipt: {ReceiptNo}.', '{MemberName}, {Amount}, {ChitGroup}, {Balance}, {ReceiptNo}'),
    ('AuctionWinner', 'Congratulations!', 'Dear {MemberName}, you won the auction for {ChitGroup} with bid ₹{BidAmount}. Net Payout: ₹{Payout}.', '{MemberName}, {ChitGroup}, {BidAmount}, {Payout}'),
    ('DividendCredit', 'Dividend Alert', 'Dividend of ₹{Amount} credited for {ChitGroup}. Next installment: ₹{NetInstallment}.', '{Amount}, {ChitGroup}, {NetInstallment}'),
    ('DemandAlert', 'Installment Due', 'Installment for {Month} is ready: ₹{Amount}. Due on {DueDate}. Group: {ChitGroup}.', '{Month}, {Amount}, {DueDate}, {ChitGroup}'),
    ('ReconciliationApproval', 'Collections Approved', 'Your submission for {Date} (₹{Amount}) has been approved. Status: {Status}.', '{Date}, {Amount}, {Status}');
END
GO
