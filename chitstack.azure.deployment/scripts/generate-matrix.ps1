param(
    [ValidateSet("tenant", "global")]
    [string]$Scope = "tenant",
    [string]$Environment = "prod",
    [string]$ConfigPath = "chitstack.azure.deployment/tenants.json",
    [string]$TenantKeysFilter = ""
)

$ErrorActionPreference = "Stop"
$config = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json -Depth 32

$items = @()

if ($Scope -eq "global") {
    if ($config.global.enabled -eq $true -and $config.global.environments.$Environment.enabled -eq $true) {
        $items += @{
            scope = "global"
            key = "global"
            environment = $Environment
            profile = $config.global.profile
        }
    }
} else {
    $allowed = $null
    if (-not [string]::IsNullOrWhiteSpace($TenantKeysFilter)) {
        $allowed = [System.Collections.Generic.HashSet[string]]::new(
            [string[]]@(
                $TenantKeysFilter.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
            )
        )
    }

    foreach ($tenant in $config.tenants) {
        if ($tenant.enabled -ne $true) { continue }
        if ($tenant.environments.$Environment.enabled -ne $true) { continue }
        if ($null -ne $allowed -and -not $allowed.Contains([string]$tenant.tenantKey)) { continue }
        $items += @{
            scope = "tenant"
            key = $tenant.tenantKey
            environment = $Environment
            profile = $tenant.profile
        }
    }
}

if ($items.Count -eq 0) {
    throw "No matrix targets generated for scope '$Scope' in environment '$Environment'."
}

$include = [array]$items
$json = @{ include = $include } | ConvertTo-Json -Depth 8 -Compress
Write-Output $json
