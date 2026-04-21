param location string
param staticWebAppLocation string
param environment string
param tenantKey string
param resourcePrefix string
param staticWebSku string
param apiPlanSku string
param sqlSku string
@secure()
param sqlAdminLogin string
@secure()
param sqlAdminPassword string

var suffix = '${environment}-${tenantKey}'
var tags = {
  scope: 'tenant'
  environment: environment
  tenantKey: tenantKey
}

module staticWeb '../static-web/main.bicep' = {
  name: 'tenant-static-${suffix}'
  params: {
    location: staticWebAppLocation
    staticWebName: 'web-${resourcePrefix}-${suffix}'
    staticWebSku: staticWebSku
    tags: tags
  }
}

module appService '../app-service/main.bicep' = {
  name: 'tenant-api-${suffix}'
  params: {
    location: location
    planName: 'plan-${resourcePrefix}-${suffix}'
    apiAppName: 'api-${resourcePrefix}-${suffix}'
    apiPlanSku: apiPlanSku
    tags: tags
  }
}

module sql '../sql/main.bicep' = {
  name: 'tenant-sql-${suffix}'
  params: {
    location: location
    sqlServerName: 'sql-${resourcePrefix}-${suffix}'
    sqlDatabaseName: 'sqldb-${resourcePrefix}-${suffix}'
    sqlSku: sqlSku
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
    tags: tags
  }
}

module sqlAppOutboundFirewall '../sql-app-outbound-firewall/main.bicep' = {
  name: 'tenant-sql-fw-${suffix}'
  params: {
    sqlServerName: 'sql-${resourcePrefix}-${suffix}'
    appServicePossibleOutboundIpAddresses: appService.outputs.possibleOutboundIpAddresses
    ruleNamePrefix: 'api-${suffix}'
  }
  dependsOn: [
    sql
  ]
}

// Key Vault names: max 24 chars, alphanumeric + hyphen (same family as api-/sql-/web-).
var keyVaultName = take('kv-${resourcePrefix}-${suffix}', 24)

module keyVault '../key-vault/main.bicep' = {
  name: 'tenant-kv-${suffix}'
  params: {
    location: location
    keyVaultName: keyVaultName
    tenantId: subscription().tenantId
    tags: tags
  }
}

module observability '../observability/main.bicep' = {
  name: 'tenant-ai-${suffix}'
  params: {
    location: location
    appInsightsName: 'ai-${resourcePrefix}-${suffix}'
    workspaceName: take('law-${resourcePrefix}-${suffix}-${uniqueString(resourceGroup().id, suffix)}', 63)
    tags: tags
  }
}
