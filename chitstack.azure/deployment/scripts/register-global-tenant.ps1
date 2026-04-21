param(
    [Parameter(Mandatory = $true)]
    [string]$Environment,
    [Parameter(Mandatory = $true)]
    [string]$TenantKey,
    [Parameter(Mandatory = $true)]
    [string]$SqlLogin,
    [Parameter(Mandatory = $true)]
    [string]$SqlPassword,
    [string]$ConfigPath = "chitstack.azure/deployment/tenants.json",
    [string]$DisplayName = "",
    [string]$Subdomain = "",
    [string]$State = "Karnataka"
)

$ErrorActionPreference = "Stop"

$config = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json -Depth 32
$tenant = $config.tenants | Where-Object { $_.tenantKey -eq $TenantKey } | Select-Object -First 1
if (-not $tenant) {
    throw "Tenant '$TenantKey' not found in $ConfigPath"
}

if ([string]::IsNullOrWhiteSpace($DisplayName)) {
    $DisplayName = if ($tenant.displayName) { [string]$tenant.displayName } else { $TenantKey }
}
if ([string]::IsNullOrWhiteSpace($Subdomain)) {
    $Subdomain = if ($tenant.subdomain) { [string]$tenant.subdomain } else { $TenantKey }
}

$globalServer = "sql-chitstack-$Environment-global.database.windows.net"
$globalDatabase = "sqldb-chitstack-$Environment-global"
$tenantServer = "sql-chitstack-$Environment-$TenantKey.database.windows.net"
$tenantDatabase = "sqldb-chitstack-$Environment-$TenantKey"

$tenantConn = "Server=tcp:$tenantServer,1433;Database=$tenantDatabase;User ID=$SqlLogin;Password=$SqlPassword;Encrypt=True;TrustServerCertificate=False;MultipleActiveResultSets=true"

$escapedName = $DisplayName.Replace("'", "''")
$escapedSub = $Subdomain.Replace("'", "''")
$escapedConn = $tenantConn.Replace("'", "''")
$escapedState = $State.Replace("'", "''")

$sql = @"
IF NOT EXISTS (SELECT 1 FROM dbo.Tenants WHERE Subdomain = N'$escapedSub')
BEGIN
  INSERT INTO dbo.Tenants (Name, Subdomain, ConnectionString, State)
  VALUES (N'$escapedName', N'$escapedSub', N'$escapedConn', N'$escapedState');
END
ELSE
BEGIN
  UPDATE dbo.Tenants
  SET Name = N'$escapedName', ConnectionString = N'$escapedConn', State = N'$escapedState'
  WHERE Subdomain = N'$escapedSub';
END
"@

$sqlPath = Join-Path $env:TEMP "register-global-tenant.sql"
Set-Content -Path $sqlPath -Value $sql -Encoding UTF8

$sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmd) {
    throw "sqlcmd not found. Install Microsoft SQL tools (mssql-tools18) on this runner."
}

& sqlcmd -S "tcp:$globalServer,1433" -d $globalDatabase -U $SqlLogin -P $SqlPassword -b -i $sqlPath
if ($LASTEXITCODE -ne 0) {
    throw "sqlcmd failed with exit code $LASTEXITCODE"
}

Write-Host "Global tenant registry updated for '$TenantKey'."
