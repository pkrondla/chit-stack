-- Map PrizePayable role to the existing standard account
UPDATE AccountHeads SET SystemRole = 'PrizePayable' WHERE AccountCode = 'LIABILITY-PRIZE-PAYABLE';
GO
