targetScope = 'resourceGroup'

@allowed([
  'global'
  'tenant'
  'website'
])
param scope string

param location string = resourceGroup().location
@description('Static Web Apps are only available in a subset of Azure regions. Host SWA here while keeping the resource group and other workloads in `location` (e.g. centralindia).')
param staticWebAppLocation string = 'eastasia'
param environment string = 'prod'
param tenantKey string = 'global'
param resourcePrefix string = 'chitstack'
param staticWebSku string
@description('Required for global and tenant scopes. Not used for website.')
param apiPlanSku string = ''
@description('Required for global and tenant scopes. Not used for website.')
param sqlSku string = ''
@secure()
@description('Required for global and tenant scopes. Not used for website.')
param sqlAdminLogin string = ''
@secure()
@description('Required for global and tenant scopes. Not used for website.')
param sqlAdminPassword string = ''

module globalStamp './modules/global-stamp/main.bicep' = if (scope == 'global') {
  name: 'global-stamp-${environment}'
  params: {
    location: location
    staticWebAppLocation: staticWebAppLocation
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
    staticWebAppLocation: staticWebAppLocation
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

module websiteStamp './modules/website-stamp/main.bicep' = if (scope == 'website') {
  name: 'website-stamp-${environment}'
  params: {
    location: location
    staticWebAppLocation: staticWebAppLocation
    environment: environment
    resourcePrefix: resourcePrefix
    staticWebSku: staticWebSku
  }
}
