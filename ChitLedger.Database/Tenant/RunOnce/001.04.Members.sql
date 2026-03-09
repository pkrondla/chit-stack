CREATE TABLE [dbo].[Members] (
    [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(200) NOT NULL,
    [Mobile] NVARCHAR(20) NOT NULL,
    [Email] NVARCHAR(200) NULL,
    [AadhaarNumber] NVARCHAR(20) NULL,
    [PanNumber] NVARCHAR(20) NULL,
    [Address] NVARCHAR(MAX) NULL,
    [TenantId] INT NOT NULL,
    [RegistrationBranchId] INT NULL,
    [Created] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    -- FK Removed for Split DB
);
GO

