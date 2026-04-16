DECLARE @TenantId INT;
DECLARE @AssetRootId INT;
DECLARE @LiabilityRootId INT;
DECLARE @EquityRootId INT;
DECLARE @IncomeRootId INT;
DECLARE @ExpenseRootId INT;
DECLARE @BankAccountsId INT;
DECLARE @CurrentAssetsId INT;
DECLARE @MemberPayablesId INT;
DECLARE @CapitalAccountsId INT;
DECLARE @ReservesId INT;
DECLARE @DirectIncomeId INT;

SELECT TOP (1) @TenantId = [Id] FROM [dbo].[Tenants] ORDER BY [Id];

IF @TenantId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Assets' AND [ParentId] IS NULL)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [IsSystem], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Assets', N'1000', 0, 1, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Liabilities' AND [ParentId] IS NULL)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [IsSystem], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Liabilities', N'2000', 1, 1, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Equity' AND [ParentId] IS NULL)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [IsSystem], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Equity', N'3000', 1, 1, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Income' AND [ParentId] IS NULL)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [IsSystem], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Income', N'4000', 2, 1, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Expenses' AND [ParentId] IS NULL)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [IsSystem], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Expenses', N'5000', 3, 1, 1, N'System');

    SELECT TOP (1) @AssetRootId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Assets' AND [ParentId] IS NULL;
    SELECT TOP (1) @LiabilityRootId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Liabilities' AND [ParentId] IS NULL;
    SELECT TOP (1) @EquityRootId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Equity' AND [ParentId] IS NULL;
    SELECT TOP (1) @IncomeRootId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Income' AND [ParentId] IS NULL;
    SELECT TOP (1) @ExpenseRootId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Expenses' AND [ParentId] IS NULL;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Fixed Assets' AND [ParentId] = @AssetRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Fixed Assets', N'1100', 0, @AssetRootId, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Bank Accounts' AND [ParentId] = @AssetRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Bank Accounts', N'1200', 0, @AssetRootId, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Current Assets' AND [ParentId] = @AssetRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Current Assets', N'1300', 0, @AssetRootId, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Current Liabilities' AND [ParentId] = @LiabilityRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Current Liabilities', N'2100', 1, @LiabilityRootId, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Member Payables' AND [ParentId] = @LiabilityRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Member Payables', N'2200', 1, @LiabilityRootId, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Capital Accounts' AND [ParentId] = @EquityRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Capital Accounts', N'3100', 1, @EquityRootId, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Reserves & Surplus' AND [ParentId] = @EquityRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Reserves & Surplus', N'3200', 1, @EquityRootId, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Direct Income (Chit)' AND [ParentId] = @IncomeRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Direct Income (Chit)', N'4100', 2, @IncomeRootId, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Indirect Income' AND [ParentId] = @IncomeRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Indirect Income', N'4200', 2, @IncomeRootId, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Direct Expenses' AND [ParentId] = @ExpenseRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Direct Expenses', N'5100', 3, @ExpenseRootId, 1, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Administrative Expenses' AND [ParentId] = @ExpenseRootId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [IsGroup], [CreatedBy])
        VALUES (@TenantId, N'Administrative Expenses', N'5200', 3, @ExpenseRootId, 1, N'System');

    SELECT TOP (1) @BankAccountsId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Bank Accounts';
    SELECT TOP (1) @CurrentAssetsId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Current Assets';
    SELECT TOP (1) @MemberPayablesId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Member Payables';
    SELECT TOP (1) @CapitalAccountsId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Capital Accounts';
    SELECT TOP (1) @ReservesId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Reserves & Surplus';
    SELECT TOP (1) @DirectIncomeId = [Id] FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Direct Income (Chit)';

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Main Bank Account' AND [ParentId] = @BankAccountsId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [SystemRole], [CreatedBy])
        VALUES (@TenantId, N'Main Bank Account', N'1201', 0, @BankAccountsId, NULL, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Cash in Hand' AND [ParentId] = @CurrentAssetsId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [SystemRole], [CreatedBy])
        VALUES (@TenantId, N'Cash in Hand', N'1301', 0, @CurrentAssetsId, NULL, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Member Receivables' AND [ParentId] = @CurrentAssetsId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [SystemRole], [CreatedBy])
        VALUES (@TenantId, N'Member Receivables', N'1302', 0, @CurrentAssetsId, N'MemberReceivable', N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Prize Money Payable' AND [ParentId] = @MemberPayablesId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [SystemRole], [CreatedBy])
        VALUES (@TenantId, N'Prize Money Payable', N'2201', 1, @MemberPayablesId, N'PrizePayable', N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Dividend Payable' AND [ParentId] = @MemberPayablesId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [CreatedBy])
        VALUES (@TenantId, N'Dividend Payable', N'2202', 1, @MemberPayablesId, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Owner Capital Account' AND [ParentId] = @CapitalAccountsId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [CreatedBy])
        VALUES (@TenantId, N'Owner Capital Account', N'3101', 1, @CapitalAccountsId, N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Retained Earnings' AND [ParentId] = @ReservesId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [SystemRole], [CreatedBy])
        VALUES (@TenantId, N'Retained Earnings', N'3201', 1, @ReservesId, N'RetainedEarnings', N'System');

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AccountHeads] WHERE [TenantId] = @TenantId AND [AccountName] = N'Foreman Commission' AND [ParentId] = @DirectIncomeId)
        INSERT INTO [dbo].[AccountHeads] ([TenantId], [AccountName], [AccountCode], [Type], [ParentId], [SystemRole], [CreatedBy])
        VALUES (@TenantId, N'Foreman Commission', N'4101', 2, @DirectIncomeId, N'CommissionIncome', N'System');
END;
GO
