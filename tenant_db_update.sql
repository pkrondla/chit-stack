IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AccountHeads]') AND name = 'SystemRole')
BEGIN
    ALTER TABLE AccountHeads ADD SystemRole NVARCHAR(100) NULL;
END
GO

-- Set roles based on current codes in the system
UPDATE AccountHeads SET SystemRole = 'MemberReceivable' WHERE AccountCode = 'RECEIVABLE-MEMBER';
UPDATE AccountHeads SET SystemRole = 'CommissionIncome' WHERE AccountCode = 'INCOME-COMMISSION';
UPDATE AccountHeads SET SystemRole = 'LateFeeIncome' WHERE AccountCode = 'INCOME-PENALTY' OR AccountCode = 'INCOME-LATE-FEE';
UPDATE AccountHeads SET SystemRole = 'TdsLiability' WHERE AccountCode = 'LIABILITY-TDS';
UPDATE AccountHeads SET SystemRole = 'GstLiability' WHERE AccountCode = 'LIABILITY-GST' OR AccountCode = 'LIABILITY-CGST' OR AccountCode = 'LIABILITY-SGST';
UPDATE AccountHeads SET SystemRole = 'Cash' WHERE AccountCode = 'ASSET-CASH';
UPDATE AccountHeads SET SystemRole = 'Bank' WHERE AccountCode = 'ASSET-BANK-MAIN' OR AccountCode = 'ASSET-BANK';
UPDATE AccountHeads SET SystemRole = 'BounceChargeIncome' WHERE AccountCode = 'INCOME-BOUNCE-CHARGES';
GO
