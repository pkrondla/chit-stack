param location string
param staticWebAppLocation string
param environment string
param resourcePrefix string
param staticWebSku string
param apiPlanSku string
param sqlSku string
@secure()
param sqlAdminLogin string
@secure()
param sqlAdminPassword string

var suffix = '${environment}-global'
var tags = {
  scope: 'global'
  environment: environment
}

module staticWeb '../static-web/main.bicep' = {
  name: 'global-static-${suffix}'
  params: {
    location: staticWebAppLocation
    staticWebName: 'web-${resourcePrefix}-${suffix}'
    staticWebSku: staticWebSku
    tags: tags
  }
}

module appService '../app-service/main.bicep' = {
  name: 'global-api-${suffix}'
  params: {
    location: location
    planName: 'plan-${resourcePrefix}-${suffix}'
    apiAppName: 'api-${resourcePrefix}-${suffix}'
    apiPlanSku: apiPlanSku
    tags: tags
  }
}

module sql '../sql/main.bicep' = {
  name: 'global-sql-${suffix}'
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

var keyVaultName = take('kv${uniqueString(resourceGroup().id, suffix, 'kv')}', 24)

module keyVault '../key-vault/main.bicep' = {
  name: 'global-kv-${suffix}'
  params: {
    location: location
    keyVaultName: keyVaultName
    tenantId: subscription().tenantId
    tags: tags
  }
}

module observability '../observability/main.bicep' = {
  name: 'global-ai-${suffix}'
  params: {
    location: location
    appInsightsName: 'ai-${resourcePrefix}-${suffix}'
    workspaceName: take('law-${resourcePrefix}-${suffix}-${uniqueString(resourceGroup().id, suffix)}', 63)
    tags: tags
  }
}
