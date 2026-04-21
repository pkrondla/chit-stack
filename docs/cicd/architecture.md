# GitHub Actions Azure CI/CD Architecture

## Deployment units
- Global stamp per environment (`global`).
- Tenant stamp per tenant key and environment (`tenant`).

Each stamp has:
- static web app
- API app service
- dedicated Azure SQL database

## Profiles
- `nonprod-ultra-low`: bootstrap default for global and tenant.
- `prod-min-safe`: promoted profile for higher reliability.

SKU profiles are defined in `chitstack.azure/deployment/tenants.json` (shared catalog) and enforced by `chitstack.azure/deployment/policies/sku-policy.json`. The global stamp reads `profile` and environment toggles from `chitstack.azure/deployment/global.json`.

## Source of truth
- Global stamp manifest: `chitstack.azure/deployment/global.json`.
- Tenant manifest: `chitstack.azure/deployment/tenants.json` (plus shared `profiles`).
- Future source of truth: Global control-plane API.
- Optional drift gate: if `chitstack.azure/deployment/tenants.control-plane.json` exists, CI validates that enabled tenant keys match the manifest exactly (`validate-deployment-sources.ps1`).

## Resource groups (plan naming)
- Global stamp: `rg-chitstack-{environment}-global`
- Tenant stamp: `rg-chitstack-{environment}-{tenantKey}`

Compute and database names inside a stamp follow `api-chitstack-{environment}-global`, `sql-chitstack-{environment}-{tenantKey}`, etc.

## Infrastructure extras per stamp
- Azure Key Vault and Log Analytics / Application Insights are deployed from Bicep for each stamp.
- App Service application settings (connection strings, stamp mode, optional App Insights) are applied from deployment scripts after the API package is deployed.

## Pipeline map
- `ci.yml`: validates config and builds all artifacts.
- `provision-global.yml` / `provision-tenant.yml`: resolve SKUs from `global.json` + `tenants.json` profiles (and per-tenant rows), then build + infra + DB + API + web + app settings for each stamp.
