param(
    [ValidateSet("global", "tenant")]
    [string]$Scope,
    [string]$Environment = "prod",
    [string]$TenantKey = "global",
    [string]$Prefix = "chitstack"
)

$ErrorActionPreference = "Stop"

& "$PSScriptRoot/resource-names.ps1" -Scope $Scope -Environment $Environment -TenantKey $TenantKey -Prefix $Prefix
