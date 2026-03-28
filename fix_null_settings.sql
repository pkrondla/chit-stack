USE [ChitLedgerTenant];
GO

UPDATE TenantSettings 
SET NotifyOnReceipt = 1,
    NotifyOnAuctionWon = 1,
    NotifyOnDividend = 0,
    NotifyOnDemand = 1,
    NotifyOnReconciliation = 1,
    NotifyOnPayout = 1
WHERE NotifyOnReceipt IS NULL;
GO
