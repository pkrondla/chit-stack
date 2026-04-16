CREATE TABLE [dbo].[CollectionRoutes] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [RouteName] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [TenantId] INT NOT NULL,
    [BranchId] INT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_CollectionRoutes_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_CollectionRoutes_IsActive] DEFAULT 1,
    CONSTRAINT [FK_CollectionRoutes_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [dbo].[Branches]([Id])
);
GO

CREATE INDEX [IX_CollectionRoutes_BranchId] ON [dbo].[CollectionRoutes]([BranchId]);
GO
