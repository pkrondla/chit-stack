param location string
param staticWebName string
param staticWebSku string
param tags object = {}

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebName
  location: location
  sku: {
    name: staticWebSku
    tier: staticWebSku
  }
  tags: tags
  properties: {
    repositoryUrl: ''
    branch: ''
    stagingEnvironmentPolicy: 'Enabled'
  }
}

output staticWebAppName string = staticWebApp.name
