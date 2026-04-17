param(
    [ValidateSet("global", "tenant")]
    [string]$Scope,
    [string]$Environment = "prod",
    [string]$TenantKey = "global",
    [string]$Prefix = "chit"
)

$ErrorActionPreference = "Stop"

if ($Scope -eq "global") {
    $TenantKey = "global"
    $resourceGroup = "rg-$Prefix-$Environment-global-global"
}
else {
    $resourceGroup = "rg-$Prefix-$Environment-tenant-$TenantKey"
}

$suffix = "$Environment-$TenantKey"

$result = @{
    resourceGroup = $resourceGroup
    apiAppName    = "api-$Prefix-$suffix"
    staticWebName = "web-$Prefix-$suffix"
    sqlServerName = "sql-$Prefix-$suffix"
    sqlDatabaseName = if ($Scope -eq "global") { "sqldb-$Prefix-$Environment-global" } else { "sqldb-$Prefix-$Environment-$TenantKey" }
}

$result | ConvertTo-Json -Compress
