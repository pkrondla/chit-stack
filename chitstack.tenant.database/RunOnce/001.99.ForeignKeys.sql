-- Foreign keys that depend on tables created later in RunOnce ordering.
-- Keeping these in a final script avoids fragile cross-file execution ordering assumptions.

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Users_Members_MemberId')
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD CONSTRAINT [FK_Users_Members_MemberId]
            FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members]([Id]);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Users_CollectionRoutes_AssignedRouteId')
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD CONSTRAINT [FK_Users_CollectionRoutes_AssignedRouteId]
            FOREIGN KEY ([AssignedRouteId]) REFERENCES [dbo].[CollectionRoutes]([Id]);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Members_CollectionRoutes_CollectionRouteId')
BEGIN
    ALTER TABLE [dbo].[Members]
        ADD CONSTRAINT [FK_Members_CollectionRoutes_CollectionRouteId]
            FOREIGN KEY ([CollectionRouteId]) REFERENCES [dbo].[CollectionRoutes]([Id]);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Receipts_CollectionSubmissions_CollectionSubmissionId')
BEGIN
    ALTER TABLE [dbo].[Receipts]
        ADD CONSTRAINT [FK_Receipts_CollectionSubmissions_CollectionSubmissionId]
            FOREIGN KEY ([CollectionSubmissionId]) REFERENCES [dbo].[CollectionSubmissions]([Id]);
END;
GO
