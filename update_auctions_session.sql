USE ChitLedgerTenant;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Auctions') AND name = 'SessionStartedAt')
BEGIN
    ALTER TABLE Auctions ADD SessionStartedAt DATETIME NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Auctions') AND name = 'SessionDurationMinutes')
BEGIN
    ALTER TABLE Auctions ADD SessionDurationMinutes INT NOT NULL DEFAULT 5;
END
GO
