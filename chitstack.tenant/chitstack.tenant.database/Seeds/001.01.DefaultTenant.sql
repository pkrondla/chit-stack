-- $(TenantId) is passed from sqlpackage at deploy time via /v:TenantId=<n>
-- It must match the Id in the global Tenants table so the local TenantId aligns with the
-- global system. All subsequent seeds read TenantId from the Tenants table dynamically.
DECLARE @TenantId INT = $(TenantId);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Tenants] WHERE [Id] = @TenantId)
BEGIN
    SET IDENTITY_INSERT [dbo].[Tenants] ON;
    INSERT INTO [dbo].[Tenants] (
        [Id],
        [TenantKey],
        [Name],
        [SubscriptionStatus],
        [CreatedBy]
    )
    VALUES (
        @TenantId,
        N'default',
        N'Default Tenant',
        N'Active',
        N'System'
    );
    SET IDENTITY_INSERT [dbo].[Tenants] OFF;
END;
GO
