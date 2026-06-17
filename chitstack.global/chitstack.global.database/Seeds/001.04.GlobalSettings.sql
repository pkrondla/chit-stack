-- Seed default GlobalSettings (idempotent — only inserts missing rows)
MERGE [dbo].[GlobalSettings] AS target
USING (VALUES
    -- Demo Stamp
    ('DemoStamp', 'ConnectionString',  '',                          'Connection string to the shared demo tenant database', 1),
    ('DemoStamp', 'TrialDays',         '30',                        'Number of trial days granted on registration', 0),
    ('DemoStamp', 'DemoTenantId',      '1',                         'Fixed TenantId used for the demo stamp', 0),
    ('DemoStamp', 'DemoBranchId',      '1',                         'Fixed BranchId used for the demo stamp', 0),
    ('DemoStamp', 'DemoPortalUrl',     'https://demo.chitstack.com','Public URL of the demo tenant portal', 0),
    -- Platform
    ('Platform',  'AMCPercentage',      '25',                        'Annual Maintenance Contract as % of total license cost', 0),
    ('Platform',  'AdminEmail',         '',                          'Global admin email for operational notifications', 0),
    ('Platform',  'PaymentUpiId',       '',                          'UPI ID for manual bank transfer payments', 0),
    ('Platform',  'PaymentBankName',    '',                          'Bank name shown to subscribers', 0),
    ('Platform',  'PaymentAccountNumber','',                         'Bank account number shown to subscribers', 0),
    ('Platform',  'PaymentIfsc',        '',                          'IFSC code shown to subscribers', 0),
    ('Platform',  'GlobalPortalBaseUrl','https://manage.chitstack.com','Base URL of the global admin portal (used in emails)', 0),
    -- Email / SMTP
    ('Email',     'SmtpHost',           '',                          'SMTP server hostname (leave blank to log emails only)', 0),
    ('Email',     'SmtpPort',           '587',                       'SMTP server port', 0),
    ('Email',     'SmtpUseSsl',         'true',                      'Whether to use SSL/TLS for SMTP', 0),
    ('Email',     'FromAddress',        'noreply@chitstack.com',      'From email address', 0),
    ('Email',     'FromName',           'ChitStack',                  'Display name for sent emails', 0),
    ('Email',     'Username',           '',                           'SMTP authentication username', 0),
    ('Email',     'Password',           '',                           'SMTP authentication password', 1)
) AS source ([SettingGroup], [SettingKey], [SettingValue], [Description], [IsSecret])
ON target.[SettingGroup] = source.[SettingGroup] AND target.[SettingKey] = source.[SettingKey]
WHEN NOT MATCHED THEN
    INSERT ([SettingGroup], [SettingKey], [SettingValue], [Description], [IsSecret])
    VALUES (source.[SettingGroup], source.[SettingKey], source.[SettingValue], source.[Description], source.[IsSecret]);
GO
