CREATE TABLE [dbo].[Members] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [FullName] NVARCHAR(200) NOT NULL,
    [PhoneNumber] NVARCHAR(20) NOT NULL,
    [Email] NVARCHAR(200) NULL,
    [AadhaarNumber] NVARCHAR(20) NULL,
    [PanNumber] NVARCHAR(20) NULL,
    [Address] NVARCHAR(MAX) NULL,
    [PanDocumentUrl] NVARCHAR(MAX) NULL,
    [AadhaarDocumentUrl] NVARCHAR(MAX) NULL,
    [PhotoUrl] NVARCHAR(MAX) NULL,
    [KycVerified] BIT NOT NULL CONSTRAINT [DF_Members_KycVerified] DEFAULT 0,
    [Latitude] DECIMAL(18,6) NULL,
    [Longitude] DECIMAL(18,6) NULL,
    [TenantId] INT NOT NULL,
    [RegistrationBranchId] INT NULL,
    [CollectionRouteId] INT NULL,
    [InPortalEnabled] BIT NOT NULL CONSTRAINT [DF_Members_InPortalEnabled] DEFAULT 1,
    [WhatsAppEnabled] BIT NOT NULL CONSTRAINT [DF_Members_WhatsAppEnabled] DEFAULT 1,
    [SmsEnabled] BIT NOT NULL CONSTRAINT [DF_Members_SmsEnabled] DEFAULT 1,
    [EmailEnabled] BIT NOT NULL CONSTRAINT [DF_Members_EmailEnabled] DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Members_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(200) NULL,
    [LastModifiedAt] DATETIME2 NULL,
    [LastModifiedBy] NVARCHAR(200) NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_Members_IsActive] DEFAULT 1,
    CONSTRAINT [FK_Members_Branches_RegistrationBranchId] FOREIGN KEY ([RegistrationBranchId]) REFERENCES [dbo].[Branches]([Id])
);
GO

CREATE UNIQUE INDEX [IX_Members_PhoneNumber] ON [dbo].[Members]([PhoneNumber]);
GO

CREATE INDEX [IX_Members_RegistrationBranchId] ON [dbo].[Members]([RegistrationBranchId]);
GO

CREATE INDEX [IX_Members_CollectionRouteId] ON [dbo].[Members]([CollectionRouteId]);
GO

