-- Seed initial product catalogue (idempotent)
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwareComponents])
BEGIN
    INSERT INTO [dbo].[SoftwareComponents]
        ([Name], [Category], [PricingType], [IsMandatory],
         [MonthlyPrice], [HalfYearlyPrice], [AnnualPrice], [LicensePrice], [HourlyPrice], [DisplayOrder], [CreatedBy])
    VALUES
        ('Chit Fund Management Software',    'Core',    'Monthly', 1,  999.00, 4999.00,  8999.00, 0,       0,      1, 'System'),
        ('WhatsApp Notifications',           'AddOn',   'Monthly', 0,  299.00, 1499.00,  2499.00, 0,       0,      2, 'System'),
        ('SMS Notifications',                'AddOn',   'Monthly', 0,  199.00,  999.00,  1699.00, 0,       0,      3, 'System'),
        ('Telegram Notifications',           'AddOn',   'Monthly', 0,  149.00,  749.00,  1299.00, 0,       0,      4, 'System'),
        ('Android Mobile App',               'AddOn',   'License', 0,    0,       0,        0,    4999.00, 0,      5, 'System'),
        ('iOS Mobile App',                   'AddOn',   'License', 0,    0,       0,        0,    4999.00, 0,      6, 'System'),
        ('Customer Support (Business Hours)','Service', 'Monthly', 0,  499.00, 2499.00,  3999.00, 0,       0,      7, 'System'),
        ('Customer Support (Extended Hours)','Service', 'Monthly', 0,  799.00, 3999.00,  6999.00, 0,       0,      8, 'System'),
        ('Custom Development',               'Service', 'Hourly',  0,    0,       0,        0,    0,       500.00, 9, 'System'),
        ('Data Migration / Setup',           'Service', 'Hourly',  0,    0,       0,        0,    0,       300.00, 10,'System');
END
GO
