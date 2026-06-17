-- Seed product catalogue (idempotent — clears and re-seeds only when table is empty)
-- PricingType: 'License' = one-time  |  'Annual' = recurring every year  |  'PerDay' = training days
-- AMC is NOT a catalog item — it is auto-calculated at 25% of the order's License total.
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwareComponents])
BEGIN
    INSERT INTO [dbo].[SoftwareComponents]
        ([Name], [Description], [Category], [PricingType], [IsMandatory],
         [LicensePrice], [AnnualPrice], [HourlyPrice],
         [MonthlyPrice], [HalfYearlyPrice],
         [DisplayOrder], [CreatedBy])
    VALUES
    --  Name                                  Description                                  Cat       Type       Mand   License  Annual  Daily(Hourly)  Monthly  HalfYr  Ord  By
        ('Chit Fund Management Software',    'Core chit fund management platform',        'Core',   'License', 1,     8999.00, 0,      0,             0,       0,      1,  'System'),
        ('WhatsApp Notifications',           'Automated WhatsApp alerts to subscribers', 'AddOn',  'License', 0,     2499.00, 0,      0,             0,       0,      2,  'System'),
        ('SMS Notifications',                'Automated SMS alerts to subscribers',      'AddOn',  'License', 0,     1699.00, 0,      0,             0,       0,      3,  'System'),
        ('Telegram Notifications',           'Automated Telegram alerts',               'AddOn',  'License', 0,     1299.00, 0,      0,             0,       0,      4,  'System'),
        ('Android Mobile App',               'Branded Android app for subscribers',     'AddOn',  'License', 0,     4999.00, 0,      0,             0,       0,      5,  'System'),
        ('iOS Mobile App',                   'Branded iOS app for subscribers',         'AddOn',  'License', 0,     4999.00, 0,      0,             0,       0,      6,  'System'),
        ('Training',                         'On-site or remote training (per day)',    'AddOn',  'PerDay',  0,     0,       0,      3000.00,       0,       0,      7,  'System'),
        ('Cloud Infrastructure',             'Managed hosting, backups & monitoring',   'AddOn',  'Annual',  0,     0,       3999.00,0,             0,       0,      8,  'System');
END
GO
