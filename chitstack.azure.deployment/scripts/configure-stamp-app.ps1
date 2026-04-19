param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("global", "tenant")]
    [string]$Scope,
    [Parameter(Mandatory = $true)]
    [string]$Environment,
    [Parameter(Mandatory = $false)]
    [string]$TenantKey = "global",
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroup,
    [Parameter(Mandatory = $true)]
    [string]$SqlLogin,
    [Parameter(Mandatory = $true)]
    [string]$SqlPassword,
    [string]$AppInsightsConnectionString = "",
    [int]$FixedTenantId = 1,
    [bool]$EnableFixedTenant = $true,
    [string]$ResourcePrefix = "chitstack"
)

$ErrorActionPreference = "Stop"

if ($Scope -eq "global") {
    $EnableFixedTenant = $false
}

$names = & "$PSScriptRoot/resource-names.ps1" -Scope $Scope -Environment $Environment -TenantKey $TenantKey | ConvertFrom-Json
$appName = $names.apiAppName

$globalServer = "sql-chit-$Environment-global.database.windows.net"
$globalDatabase = "sqldb-chit-$Environment-global"
$globalConn = "Server=tcp:$globalServer,1433;Database=$globalDatabase;User ID=$SqlLogin;Password=$SqlPassword;Encrypt=True;TrustServerCertificate=False;MultipleActiveResultSets=true"

$settings = [ordered]@{}

if ($Scope -eq "global") {
    $settings["ConnectionStrings__GlobalDBConnection"] = $globalConn
    $settings["SeedOnStartup"] = "false"
}
else {
    $tenantServer = "$($names.sqlServerName).database.windows.net"
    $tenantDatabase = $names.sqlDatabaseName
    $tenantConn = "Server=tcp:$tenantServer,1433;Database=$tenantDatabase;User ID=$SqlLogin;Password=$SqlPassword;Encrypt=True;TrustServerCertificate=False;MultipleActiveResultSets=true"
    $settings["ConnectionStrings__GlobalDBConnection"] = $globalConn
    $settings["ConnectionStrings__TenantDBConnection"] = $tenantConn
    $settings["TenantStamp__EnableFixedTenant"] = $(if ($EnableFixedTenant) { "true" } else { "false" })
    $settings["TenantStamp__FixedTenantId"] = "$FixedTenantId"
    $settings["TenantStamp__FixedTenantConnectionString"] = $tenantConn
    $settings["SeedOnStartup"] = "false"
}

if (-not [string]::IsNullOrWhiteSpace($AppInsightsConnectionString)) {
    $settings["APPLICATIONINSIGHTS_CONNECTION_STRING"] = $AppInsightsConnectionString
}

foreach ($kv in $settings.GetEnumerator()) {
    $pair = "$($kv.Key)=$($kv.Value)"
    Write-Host "Setting $pair"
    az webapp config appsettings set -g $ResourceGroup -n $appName --settings $pair | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "az webapp config appsettings set failed for $($kv.Key) with exit code $LASTEXITCODE"
    }
}

Write-Host "App settings updated for $appName."
