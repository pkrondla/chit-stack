-- Foreign keys that depend on tables created earlier in RunOnce ordering.

ALTER TABLE [dbo].[Users]
    ADD CONSTRAINT [FK_Users_Members_MemberId]
        FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members]([Id]);
GO

ALTER TABLE [dbo].[Users]
    ADD CONSTRAINT [FK_Users_CollectionRoutes_AssignedRouteId]
        FOREIGN KEY ([AssignedRouteId]) REFERENCES [dbo].[CollectionRoutes]([Id]);
GO

ALTER TABLE [dbo].[Members]
    ADD CONSTRAINT [FK_Members_CollectionRoutes_CollectionRouteId]
        FOREIGN KEY ([CollectionRouteId]) REFERENCES [dbo].[CollectionRoutes]([Id]);
GO

ALTER TABLE [dbo].[Receipts]
    ADD CONSTRAINT [FK_Receipts_CollectionSubmissions_CollectionSubmissionId]
        FOREIGN KEY ([CollectionSubmissionId]) REFERENCES [dbo].[CollectionSubmissions]([Id]);
GO
