IF NOT EXISTS (SELECT 1 FROM [dbo].[Tenants] WHERE [Subdomain] = N'platform')
BEGIN
    INSERT INTO [dbo].[Tenants] (
        [Name],
        [Subdomain],
        [ConnectionString],
        [State],
        [CreatedBy]
    )
    VALUES (
        N'ChitStack Platform',
        N'platform',
        N'',
        N'Karnataka',
        N'System'
    );
END;
GO
