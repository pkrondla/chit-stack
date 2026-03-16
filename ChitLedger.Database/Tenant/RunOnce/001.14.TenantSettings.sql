-- Migration: Add TenantSettings table for company profile data used in statutory documents
CREATE TABLE [dbo].[TenantSettings] (
    [Id]                       INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [CompanyName]              NVARCHAR(200)     NOT NULL DEFAULT '',
    [RegistrationNumber]       NVARCHAR(100)     NOT NULL DEFAULT '',  -- ROC Regd. No.
    [RegisteredOfficeAddress]  NVARCHAR(500)     NOT NULL DEFAULT '',
    [ForemanName]              NVARCHAR(200)     NOT NULL DEFAULT '',
    [ForemanDesignation]       NVARCHAR(100)     NOT NULL DEFAULT 'Authorized Signatory',
    [PhoneNumber]              NVARCHAR(20)      NOT NULL DEFAULT '',
    [Email]                    NVARCHAR(200)     NOT NULL DEFAULT '',
    [StatutoryFilingFees]      DECIMAL(18,2)     NOT NULL DEFAULT 0,
    [GstNumber]                NVARCHAR(20)      NULL,
    [PanNumber]                NVARCHAR(20)      NULL,
    [MaxBiddingDiscountPercent] DECIMAL(18,2)     NOT NULL DEFAULT 40,
    [TenantId]                 INT               NOT NULL,
    [Created]                  DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);
GO
