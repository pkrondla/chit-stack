DECLARE @TenantId INT;
SELECT TOP (1) @TenantId = [Id] FROM [dbo].[Tenants] ORDER BY [Id];

IF @TenantId IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM [dbo].[Branches] WHERE [TenantId] = @TenantId AND [Code] = N'HQ')
BEGIN
    INSERT INTO [dbo].[Branches] (
        [TenantId],
        [Code],
        [Name],
        [Address],
        [ContactNumber],
        [CreatedBy]
    )
    VALUES (
        @TenantId,
        N'HQ',
        N'Headquarters',
        N'123 Main St',
        N'555-0100',
        N'System'
    );
END;
GO
