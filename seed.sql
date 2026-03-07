USE ChitLedgerGlobal;
GO

IF NOT EXISTS(SELECT 1 FROM Tenants WHERE TenantKey = 'default')
BEGIN
    INSERT INTO Tenants (TenantKey, Name, SubscriptionStatus) VALUES ('default', 'Default Tenant', 'Active');
END
GO

DECLARE @TenantId INT = (SELECT Id FROM Tenants WHERE TenantKey = 'default');

IF NOT EXISTS(SELECT 1 FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, Role, TenantId) VALUES ('admin', 'admin123', 'admin@example.com', 'Admin', @TenantId);
END
GO
