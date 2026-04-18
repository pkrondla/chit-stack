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

Profile values are defined in `chitstack.azure.deployment/tenants.json` and enforced by `chitstack.azure.deployment/policies/sku-policy.json`.

## Source of truth
- Initial source of truth: `chitstack.azure.deployment/tenants.json`.
- Future source of truth: Global control-plane API.
- Optional drift gate: if `chitstack.azure.deployment/tenants.control-plane.json` exists, CI validates that enabled tenant keys match the manifest exactly (`validate-deployment-sources.ps1`).

## Resource groups (plan naming)
- Global stamp: `rg-chitstack-{environment}-global`
- Tenant stamp: `rg-chitstack-{environment}-{tenantKey}`

Compute and database names inside a stamp remain `api-chit-{environment}-global`, `sql-chit-{environment}-{tenantKey}`, etc.

## Infrastructure extras per stamp
- Azure Key Vault and Log Analytics / Application Insights are deployed from Bicep for each stamp.
- App Service application settings (connection strings, stamp mode, optional App Insights) are applied from deployment scripts after the API package is deployed.

## Rollout policy
- `chitstack.azure.deployment/policies/rollout-policy.json` supplies default `maxParallel` per environment when `deploy-tenants-batch.yml` is run with an empty `maxParallel` input.

## Pipeline map
- `ci.yml`: validates config and builds all artifacts.
- `provision-global.yml` / `provision-tenant.yml`: creates or reconciles stamps.
- `deploy-global.yml` / `deploy-tenant.yml`: self-contained deploy (build + infra + DB + API + web + app settings) so a dispatch does not depend on a separate CI artifact run.
- `deploy-tenants-batch.yml`: batch deployment to all enabled tenants in an environment.
- `upgrade-global.yml` / `upgrade-tenant.yml`: profile and SKU upgrade path.
