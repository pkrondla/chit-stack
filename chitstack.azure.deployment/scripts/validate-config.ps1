param(
    [string]$ConfigPath = "chitstack.azure.deployment/tenants.json",
    [string]$PolicyPath = "chitstack.azure.deployment/policies/sku-policy.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ConfigPath)) {
    throw "Config file not found: $ConfigPath"
}

if (-not (Test-Path $PolicyPath)) {
    throw "Policy file not found: $PolicyPath"
}

$config = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json -Depth 32
$policy = Get-Content -Raw -Path $PolicyPath | ConvertFrom-Json -Depth 32

if (-not $config.profiles.PSObject.Properties.Name) {
    throw "No profiles defined in config."
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
        throw "Profile '$ProfileName' not found."
    }
    return $prop.Value
}

$globalProfile = Resolve-Profile -ProfileName $config.global.profile
$globalOverrides = $null
if (($config.global.PSObject.Properties.Name -contains 'overrides') -and $config.global.overrides) {
    $globalOverrides = $config.global.overrides
}

foreach ($envProp in $config.global.environments.PSObject.Properties) {
    if ($envProp.Value.enabled -ne $true) { continue }
    $staticWebSku = if ($globalOverrides -and $globalOverrides.staticWebSku) { [string]$globalOverrides.staticWebSku } else { $globalProfile.staticWebSku }
    $apiPlanSku = if ($globalOverrides -and $globalOverrides.apiPlanSku) { [string]$globalOverrides.apiPlanSku } else { $globalProfile.apiPlanSku }
    $sqlSku = if ($globalOverrides -and $globalOverrides.sqlSku) { [string]$globalOverrides.sqlSku } else { $globalProfile.sqlSku }
    Test-SkuAllowed -Environment $envProp.Name -StaticWebSku $staticWebSku -ApiPlanSku $apiPlanSku -SqlSku $sqlSku
}

foreach ($tenant in $config.tenants) {
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

Write-Host "Tenant/global configuration validation passed."

& "$PSScriptRoot/validate-deployment-sources.ps1" -ManifestPath $ConfigPath
