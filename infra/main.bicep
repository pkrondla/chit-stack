targetScope = 'resourceGroup'

@allowed([
  'global'
  'tenant'
])
param scope string

param location string = resourceGroup().location
param environment string = 'prod'
param tenantKey string = 'global'
param resourcePrefix string = 'chit'
param staticWebSku string
param apiPlanSku string
param sqlSku string
@secure()
param sqlAdminLogin string
@secure()
param sqlAdminPassword string

module globalStamp './modules/global-stamp/main.bicep' = if (scope == 'global') {
  name: 'global-stamp-${environment}'
  params: {
    location: location
    environment: environment
    resourcePrefix: resourcePrefix
    staticWebSku: staticWebSku
    apiPlanSku: apiPlanSku
    sqlSku: sqlSku
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
  }
}

module tenantStamp './modules/tenant-stamp/main.bicep' = if (scope == 'tenant') {
  name: 'tenant-stamp-${environment}-${tenantKey}'
  params: {
    location: location
    environment: environment
    tenantKey: tenantKey
    resourcePrefix: resourcePrefix
    staticWebSku: staticWebSku
    apiPlanSku: apiPlanSku
    sqlSku: sqlSku
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
  }
}
