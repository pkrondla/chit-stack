CREATE TABLE [dbo].[Affiliates] (
    [Id]                INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Code]              NVARCHAR(20)  NOT NULL,
    [Name]              NVARCHAR(200) NOT NULL,
    [Email]             NVARCHAR(200) NOT NULL,
    [Phone]             NVARCHAR(50)  NOT NULL,
    [CompanyName]       NVARCHAR(200) NULL,
    [PasswordHash]      NVARCHAR(MAX) NOT NULL,
    [IsApproved]        BIT           NOT NULL CONSTRAINT [DF_Aff_IsApproved]  DEFAULT 0,
    [CommissionPercent] DECIMAL(5,2)  NULL,   -- NULL = use GlobalSettings default
    [ApprovedAt]        DATETIME2     NULL,
    [ApprovedBy]        NVARCHAR(200) NULL,
    -- Audit
    [CreatedAt]         DATETIME2     NOT NULL CONSTRAINT [DF_Aff_CreatedAt]   DEFAULT GETUTCDATE(),
    [CreatedBy]         NVARCHAR(200) NULL,
    [LastModifiedAt]    DATETIME2     NULL,
    [LastModifiedBy]    NVARCHAR(200) NULL,
    [IsActive]          BIT           NOT NULL CONSTRAINT [DF_Aff_IsActive]    DEFAULT 1
);
GO

CREATE UNIQUE INDEX [IX_Affiliates_Code]  ON [dbo].[Affiliates]([Code]);
GO

CREATE UNIQUE INDEX [IX_Affiliates_Email] ON [dbo].[Affiliates]([Email]);
GO
