-- Clear existing roles if any
UPDATE AccountHeads SET SystemRole = NULL;

-- Correctly map roles to codes based on SeedAccountHeadsCommand
UPDATE AccountHeads SET SystemRole = 'MemberReceivable' WHERE AccountCode = 'RECEIVABLE-MEMBER';
UPDATE AccountHeads SET SystemRole = 'CommissionIncome' WHERE AccountCode = 'INCOME-COMMISSION';
UPDATE AccountHeads SET SystemRole = 'LateFeeIncome' WHERE AccountCode = 'INCOME-PENALTY';
UPDATE AccountHeads SET SystemRole = 'TdsLiability' WHERE AccountCode = 'LIABILITY-TDS';
UPDATE AccountHeads SET SystemRole = 'GstLiability' WHERE AccountCode = 'LIABILITY-GST';
UPDATE AccountHeads SET SystemRole = 'Cash' WHERE AccountCode = 'ASSET-CASH';
UPDATE AccountHeads SET SystemRole = 'Bank' WHERE AccountCode = 'ASSET-BANK-MAIN';
UPDATE AccountHeads SET SystemRole = 'BounceChargeIncome' WHERE AccountCode = 'INCOME-BOUNCE-CHARGES';
GO
