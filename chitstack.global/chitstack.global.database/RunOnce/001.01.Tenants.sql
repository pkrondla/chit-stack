CREATE TABLE [dbo].[Tenants] (
    [Id]                 INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name]               NVARCHAR(200)  NOT NULL,
    [Subdomain]          NVARCHAR(100)  NOT NULL,
    [ConnectionString]   NVARCHAR(MAX)  NOT NULL CONSTRAINT [DF_GlobalTenants_ConnectionString] DEFAULT N'',
    [State]              NVARCHAR(100)  NOT NULL CONSTRAINT [DF_GlobalTenants_State]            DEFAULT N'Karnataka',
    -- Registration & trial
    [SubscriptionStatus] NVARCHAR(50)   NOT NULL CONSTRAINT [DF_T_Status]    DEFAULT N'DemoAccess',
    [TrialStartDate]     DATETIME2      NOT NULL CONSTRAINT [DF_T_TrialStart] DEFAULT GETUTCDATE(),
    [TrialEndDate]       DATETIME2      NOT NULL CONSTRAINT [DF_T_TrialEnd]   DEFAULT DATEADD(DAY, 30, GETUTCDATE()),
    [ContactEmail]       NVARCHAR(200)  NOT NULL CONSTRAINT [DF_T_Email]      DEFAULT N'',
    [ContactPhone]       NVARCHAR(50)   NULL,
    [ProvisionedAt]      DATETIME2      NULL,
    [AffiliateId]        INT            NULL REFERENCES [dbo].[Affiliates]([Id]),
    -- Audit
    [CreatedAt]          DATETIME2      NOT NULL CONSTRAINT [DF_GlobalTenants_CreatedAt] DEFAULT GETUTCDATE(),
    [CreatedBy]          NVARCHAR(200)  NULL,
    [LastModifiedAt]     DATETIME2      NULL,
    [LastModifiedBy]     NVARCHAR(200)  NULL,
    [IsActive]           BIT            NOT NULL CONSTRAINT [DF_GlobalTenants_IsActive] DEFAULT 1
);
GO

CREATE UNIQUE INDEX [IX_GlobalTenants_Subdomain] ON [dbo].[Tenants]([Subdomain]);
GO

CREATE INDEX [IX_GlobalTenants_Email] ON [dbo].[Tenants]([ContactEmail]);
GO
