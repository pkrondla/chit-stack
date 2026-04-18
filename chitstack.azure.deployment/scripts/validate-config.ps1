param(
    [string]$GlobalManifestPath = "chitstack.azure.deployment/global.json",
    [string]$ConfigPath = "chitstack.azure.deployment/tenants.json",
    [string]$PolicyPath = "chitstack.azure.deployment/policies/sku-policy.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $GlobalManifestPath)) {
    throw "Global manifest not found: $GlobalManifestPath"
}

if (-not (Test-Path $ConfigPath)) {
    throw "Config file not found: $ConfigPath"
}

if (-not (Test-Path $PolicyPath)) {
    throw "Policy file not found: $PolicyPath"
}

$globalManifest = Get-Content -Raw -Path $GlobalManifestPath | ConvertFrom-Json -Depth 32
$config = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json -Depth 32
$policy = Get-Content -Raw -Path $PolicyPath | ConvertFrom-Json -Depth 32

if (-not $config.profiles.PSObject.Properties.Name) {
    throw "No profiles defined in $ConfigPath."
}

function Test-SkuAllowed {
    param(
        [string]$Environment,
        [string]$StaticWebSku,
        [string]$ApiPlanSku,
        [string]$SqlSku
    )

    $isProd = $Environment -eq "prod"
    $scope = if ($isProd) { $policy.production } else { $policy.nonProduction }

    if ($scope.allowedStaticWebSkus -notcontains $StaticWebSku) {
        throw "StaticWeb SKU '$StaticWebSku' is not allowed in '$Environment'."
    }
    if ($scope.allowedApiPlanSkus -notcontains $ApiPlanSku) {
        throw "API SKU '$ApiPlanSku' is not allowed in '$Environment'."
    }
    if ($scope.allowedSqlSkus -notcontains $SqlSku) {
        throw "SQL SKU '$SqlSku' is not allowed in '$Environment'."
    }
}

function Resolve-Profile {
    param(
        [string]$ProfileName
    )

    $prop = $config.profiles.PSObject.Properties[$ProfileName]
    if (-not $prop) {
        throw "Profile '$ProfileName' not found in $ConfigPath."
    }
    return $prop.Value
}

if ($globalManifest.enabled -ne $true) {
    throw "Global stamp is disabled in $GlobalManifestPath (enabled must be true for validation)."
}

$globalProfile = Resolve-Profile -ProfileName $globalManifest.profile
$globalOverrides = $null
if (($globalManifest.PSObject.Properties.Name -contains 'overrides') -and $globalManifest.overrides) {
    $globalOverrides = $globalManifest.overrides
}

foreach ($envProp in $globalManifest.environments.PSObject.Properties) {
    if ($envProp.Value.enabled -ne $true) { continue }
    $staticWebSku = if ($globalOverrides -and $globalOverrides.staticWebSku) { [string]$globalOverrides.staticWebSku } else { $globalProfile.staticWebSku }
    $apiPlanSku = if ($globalOverrides -and $globalOverrides.apiPlanSku) { [string]$globalOverrides.apiPlanSku } else { $globalProfile.apiPlanSku }
    $sqlSku = if ($globalOverrides -and $globalOverrides.sqlSku) { [string]$globalOverrides.sqlSku } else { $globalProfile.sqlSku }
    Test-SkuAllowed -Environment $envProp.Name -StaticWebSku $staticWebSku -ApiPlanSku $apiPlanSku -SqlSku $sqlSku
}

foreach ($tenant in $config.tenants) {
    if (-not ($tenant.PSObject.Properties.Name -contains 'tenantId')) {
        throw "Tenant '$($tenant.tenantKey)' is missing required field 'tenantId'."
    }
    if (-not ($tenant.tenantId -as [int]) -or [int]$tenant.tenantId -le 0) {
        throw "Tenant '$($tenant.tenantKey)' has invalid tenantId '$($tenant.tenantId)'. It must be a positive integer."
    }
    if ($tenant.enabled -ne $true) { continue }
    $tenantProfile = Resolve-Profile -ProfileName $tenant.profile
    $tenantOverrides = $null
    if (($tenant.PSObject.Properties.Name -contains 'overrides') -and $tenant.overrides) {
        $tenantOverrides = $tenant.overrides
    }

    foreach ($envProp in $tenant.environments.PSObject.Properties) {
        if ($envProp.Value.enabled -ne $true) { continue }
        $staticWebSku = if ($tenantOverrides -and $tenantOverrides.staticWebSku) { [string]$tenantOverrides.staticWebSku } else { $tenantProfile.staticWebSku }
        $apiPlanSku = if ($tenantOverrides -and $tenantOverrides.apiPlanSku) { [string]$tenantOverrides.apiPlanSku } else { $tenantProfile.apiPlanSku }
        $sqlSku = if ($tenantOverrides -and $tenantOverrides.sqlSku) { [string]$tenantOverrides.sqlSku } else { $tenantProfile.sqlSku }
        Test-SkuAllowed -Environment $envProp.Name -StaticWebSku $staticWebSku -ApiPlanSku $apiPlanSku -SqlSku $sqlSku
    }
}

$tenantIds = @($config.tenants | ForEach-Object { [int]$_.tenantId })
$duplicateTenantIds = @($tenantIds | Group-Object | Where-Object { $_.Count -gt 1 } | ForEach-Object { $_.Name })
if ($duplicateTenantIds.Count -gt 0) {
    throw "Duplicate tenantId values found in config: $($duplicateTenantIds -join ', ')"
}

Write-Host "Tenant/global configuration validation passed."

& "$PSScriptRoot/validate-deployment-sources.ps1" -ManifestPath $ConfigPath
