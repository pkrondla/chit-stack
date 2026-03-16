ALTER TABLE AccountHeads ADD SystemRole NVARCHAR(100) NULL;
GO

-- Update existing accounts with their roles based on current hardcoded codes
UPDATE AccountHeads SET SystemRole = 'MemberReceivable' WHERE AccountCode = 'RECEIVABLE-MEMBER';
UPDATE AccountHeads SET SystemRole = 'CommissionIncome' WHERE AccountCode = 'INCOME-COMMISSION';
UPDATE AccountHeads SET SystemRole = 'LateFeeIncome' WHERE AccountCode = 'INCOME-LATE-FEE';
UPDATE AccountHeads SET SystemRole = 'CgstLiability' WHERE AccountCode = 'LIABILITY-CGST';
UPDATE AccountHeads SET SystemRole = 'SgstLiability' WHERE AccountCode = 'LIABILITY-SGST';
UPDATE AccountHeads SET SystemRole = 'TdsLiability' WHERE AccountCode = 'LIABILITY-TDS';
UPDATE AccountHeads SET SystemRole = 'Cash' WHERE AccountCode = 'ASSET-CASH';
UPDATE AccountHeads SET SystemRole = 'Bank' WHERE AccountCode = 'ASSET-BANK';
GO
