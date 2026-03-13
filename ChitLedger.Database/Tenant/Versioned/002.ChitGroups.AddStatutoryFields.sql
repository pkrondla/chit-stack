-- Versioned migration: Add statutory/regulatory columns to ChitGroups table
ALTER TABLE [dbo].[ChitGroups]
    ADD [SanctionNumber]            NVARCHAR(100)  NULL,
        [SanctionDate]              DATETIME2      NULL,
        [RegistrationNumber]        NVARCHAR(100)  NULL,
        [RegistrationDate]          DATETIME2      NULL,
        [AuctionVenueAddress]       NVARCHAR(500)  NULL,
        [SecurityDepositBankName]   NVARCHAR(200)  NULL,
        [SecurityDepositBankBranch] NVARCHAR(200)  NULL,
        [SecurityDepositFdrNumber]  NVARCHAR(100)  NULL,
        [SecurityDepositDate]       DATETIME2      NULL,
        [FilingFees]                DECIMAL(18,2)  NOT NULL DEFAULT 0;
GO
