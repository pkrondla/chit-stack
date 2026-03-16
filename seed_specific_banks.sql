-- Seed specific bank accounts for TenantId 1
INSERT INTO AccountHeads (AccountName, AccountCode, Type, IsSystem, SystemRole, TenantId, CreatedAt, IsActive, BankDetails)
VALUES 
(
    'Equitas Bank - Trichy Road', 
    'BANK-EQUITAS-01', 
    0, -- Asset
    0, -- Not System (User created)
    'Bank', 
    1, 
    GETDATE(), 
    1, 
    'A/C Type: Current Account, A/C No: 200028021982, Bank: Equitas Bank, IFSC Code: ESFB0001029, Branch: Trichy Road'
),
(
    'ICICI Bank - R.S Puram', 
    'BANK-ICICI-01', 
    0, -- Asset
    0, -- Not System (User created)
    'Bank', 
    1, 
    GETDATE(), 
    1, 
    'A/C Type: Current Account, A/C No: 034205009332, IFSCODE: ICIC0000342, ICICI Bank, R.S Puram Branch, Coimbatore'
);
GO
