-- Seed standard accounts for TenantId 1
INSERT INTO AccountHeads (AccountName, AccountCode, Type, IsSystem, SystemRole, TenantId, CreatedAt, IsActive)
VALUES 
('Cash in Hand', 'ASSET-CASH', 0, 1, 'Cash', 1, GETDATE(), 1),
('Main Bank Account', 'ASSET-BANK-MAIN', 0, 1, 'Bank', 1, GETDATE(), 1),
('Member Receivables', 'RECEIVABLE-MEMBER', 0, 1, 'MemberReceivable', 1, GETDATE(), 1),
('Prize Money Payable', 'LIABILITY-PRIZE-PAYABLE', 1, 1, NULL, 1, GETDATE(), 1),
('Foreman Commission Payable', 'LIABILITY-COMMISSION-PAYABLE', 1, 1, NULL, 1, GETDATE(), 1),
('TDS Payable', 'LIABILITY-TDS', 1, 1, 'TdsLiability', 1, GETDATE(), 1),
('GST Payable', 'LIABILITY-GST', 1, 1, 'GstLiability', 1, GETDATE(), 1),
('Foreman Commission Income', 'INCOME-COMMISSION', 2, 1, 'CommissionIncome', 1, GETDATE(), 1),
('Admission Fees', 'INCOME-FEES', 2, 1, NULL, 1, GETDATE(), 1),
('Penalty/Late Fee Income', 'INCOME-PENALTY', 2, 1, 'LateFeeIncome', 1, GETDATE(), 1),
('Cheque Bounce Charges', 'INCOME-BOUNCE-CHARGES', 2, 1, 'BounceChargeIncome', 1, GETDATE(), 1),
('Auction Dividend (Loss)', 'EXPENSE-DIVIDEND', 3, 1, NULL, 1, GETDATE(), 1),
('Bank Charges', 'EXPENSE-BANK-CHARGES', 3, 1, NULL, 1, GETDATE(), 1),
('Office Expenses', 'EXPENSE-OFFICE', 3, 0, NULL, 1, GETDATE(), 1);
GO
