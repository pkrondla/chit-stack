-- Bootstrap global admin for first login (matches GlobalLogin plain comparison until hashing is implemented).
-- Change this password immediately after first successful login in production.

DECLARE @PlatformTenantId INT;
SELECT @PlatformTenantId = [Id]
FROM [dbo].[Tenants]
WHERE [Subdomain] = N'platform';

IF @PlatformTenantId IS NULL
BEGIN
    THROW 50001, N'Global seed requires Tenants row with Subdomain ''platform'' (run 001.01.PlatformTenant.sql first).', 1;
END;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Username] = N'admin')
BEGIN
    INSERT INTO [dbo].[Users] (
        [Username],
        [PasswordHash],
        [Email],
        [FullName],
        [Role],
        [TenantId],
        [CreatedBy]
    )
    VALUES (
        N'admin',
        N'admin123',
        N'admin@example.com',
        N'Platform Admin',
        N'Admin',
        @PlatformTenantId,
        N'System'
    );
END;
GO
