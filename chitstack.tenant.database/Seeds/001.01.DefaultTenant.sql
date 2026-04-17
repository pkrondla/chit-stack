IF NOT EXISTS (SELECT 1 FROM [dbo].[Tenants])
BEGIN
    INSERT INTO [dbo].[Tenants] (
        [TenantKey],
        [Name],
        [SubscriptionStatus],
        [CreatedBy]
    )
    VALUES (
        N'default',
        N'Default Tenant',
        N'Active',
        N'System'
    );
END;
GO
