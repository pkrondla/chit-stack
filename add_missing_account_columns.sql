IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AccountHeads]') AND name = 'BranchId')
BEGIN
    ALTER TABLE AccountHeads ADD BranchId INT NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[BankDetails]') AND name = 'BankDetails')
BEGIN
    ALTER TABLE AccountHeads ADD BankDetails NVARCHAR(MAX) NULL;
END
GO
