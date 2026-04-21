param(
    [string]$ManifestPath = "chitstack.azure/deployment/tenants.json",
    [string]$ControlPlanePath = "chitstack.azure/deployment/tenants.control-plane.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ManifestPath)) {
    throw "Manifest not found: $ManifestPath"
}

$manifest = Get-Content -Raw -Path $ManifestPath | ConvertFrom-Json -Depth 32

$manifestKeys = [System.Collections.Generic.HashSet[string]]::new()
foreach ($t in $manifest.tenants) {
    if ($t.enabled -ne $true) { continue }
    $k = [string]$t.tenantKey
    if ([string]::IsNullOrWhiteSpace($k)) {
        throw "Tenant entry has empty tenantKey."
    }
    if ($manifestKeys.Contains($k)) {
        throw "Duplicate enabled tenantKey in manifest: '$k'"
    }
    $manifestKeys.Add($k) | Out-Null
}

if (Test-Path $ControlPlanePath) {
    $remote = Get-Content -Raw -Path $ControlPlanePath | ConvertFrom-Json -Depth 32
    if (-not $remote.tenants) {
        throw "Control plane file exists but has no 'tenants' array: $ControlPlanePath"
    }

    $remoteKeys = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($t in $remote.tenants) {
        if ($t.enabled -ne $true) { continue }
        $rk = [string]$t.tenantKey
        if ([string]::IsNullOrWhiteSpace($rk)) {
            throw "Control plane tenant entry has empty tenantKey."
        }
        if ($remoteKeys.Contains($rk)) {
            throw "Duplicate enabled tenantKey in control plane snapshot: '$rk'"
        }
        $remoteKeys.Add($rk) | Out-Null
    }

    foreach ($k in $manifestKeys) {
        if (-not $remoteKeys.Contains($k)) {
            throw "Drift: enabled tenantKey '$k' exists in manifest but not in control plane snapshot ($ControlPlanePath)."
        }
    }

    foreach ($k in $remoteKeys) {
        if (-not $manifestKeys.Contains($k)) {
            throw "Drift: enabled tenantKey '$k' exists in control plane snapshot but not in manifest."
        }
    }
}

Write-Host "Deployment source validation passed."
