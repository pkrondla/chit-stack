@description('Short SQL server name in this resource group (not FQDN).')
param sqlServerName string

@description('Comma-separated list from the API App Service property possibleOutboundIpAddresses.')
param appServicePossibleOutboundIpAddresses string

@description('Prefix for firewall rule names; must be unique per server among rules this template manages.')
param ruleNamePrefix string

// App Service publishes a superset of IPs it may use for egress; lock SQL to those /32s only.
// Azure SQL allows at most 128 firewall rules per server — very large plans can exceed this.
var parts = split(appServicePossibleOutboundIpAddresses, ',')

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' existing = {
  name: sqlServerName
}

resource firewallRules 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = [for i in range(0, length(parts)): {
  parent: sqlServer
  name: take('${ruleNamePrefix}-${replace(trim(parts[i]), '.', '-')}', 128)
  properties: {
    startIpAddress: trim(parts[i])
    endIpAddress: trim(parts[i])
  }
}]
