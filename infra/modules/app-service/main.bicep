param location string
param planName string
param apiAppName string
param apiPlanSku string
param tags object = {}

resource serverFarm 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  sku: {
    name: apiPlanSku
    tier: apiPlanSku == 'F1' ? 'Free' : (apiPlanSku == 'D1' ? 'Shared' : (startsWith(apiPlanSku, 'P') ? 'PremiumV3' : (startsWith(apiPlanSku, 'S') ? 'Standard' : 'Basic')))
    capacity: 1
  }
  kind: 'app'
  tags: tags
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: apiAppName
  location: location
  kind: 'app'
  tags: tags
  properties: {
    httpsOnly: true
    serverFarmId: serverFarm.id
    siteConfig: {
      minTlsVersion: '1.2'
      alwaysOn: !contains(['F1', 'D1'], apiPlanSku)
    }
  }
}

output appServiceName string = webApp.name
output appServicePlanName string = serverFarm.name
