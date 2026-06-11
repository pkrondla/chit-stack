# CI/CD Architecture (Quick Reference)

> For the full guide, see [CI/CD README](README.md).

## Deployment units

- **Global stamp** per environment (`global`)
- **Tenant stamp** per tenant key and environment (`tenant`)

Each stamp includes: Static Web App, API App Service, dedicated Azure SQL database, Key Vault, and Application Insights.

## Profiles

| Profile | Typical use |
|---------|-------------|
| `nonprod-ultra-low` | Bootstrap, demo, portfolio |
| `prod-min-safe` | Higher reliability production |

SKUs are defined in `chitstack.azure/deployment/tenants.json` and enforced by `chitstack.azure/deployment/policies/sku-policy.json`.

## Source of truth

| File | Purpose |
|------|---------|
| `chitstack.azure/deployment/global.json` | Global stamp config |
| `chitstack.azure/deployment/tenants.json` | Tenants + shared profiles |
| `chitstack.azure/deployment/policies/sku-policy.json` | Allowed SKUs |

Optional drift gate: `tenants.control-plane.json` + `validate-deployment-sources.ps1`.

## Resource naming

| Stamp | Resource group |
|-------|----------------|
| Global | `rg-chitstack-{environment}-global` |
| Tenant | `rg-chitstack-{environment}-{tenantKey}` |

Compute and database names: `api-chitstack-{environment}-global`, `sql-chitstack-{environment}-{tenantKey}`, etc.

## Pipeline map

| Workflow | Role |
|----------|------|
| `ci.yml` | Validate config, build, test, artifacts |
| `provision-global.yml` | Global stamp: build + infra + DB + API + web |
| `provision-tenant.yml` | Tenant stamp: build + infra + DB + API + web |
| `deploy-infra.yml` | Reusable Bicep deploy (called by provision workflows) |
