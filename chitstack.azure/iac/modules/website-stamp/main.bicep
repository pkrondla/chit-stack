param location string
param staticWebAppLocation string
param environment string
param resourcePrefix string
param staticWebSku string

var suffix = '${environment}-website'
var tags = {
  scope: 'website'
  environment: environment
}

module staticWeb '../static-web/main.bicep' = {
  name: 'website-static-${suffix}'
  params: {
    location: staticWebAppLocation
    staticWebName: 'web-${resourcePrefix}-${suffix}'
    staticWebSku: staticWebSku
    tags: tags
  }
}

output staticWebAppName string = staticWeb.outputs.staticWebAppName
