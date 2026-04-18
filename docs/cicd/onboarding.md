# Tenant Onboarding Runbook

## Goal
Provision a new tenant with isolated web, API, and Azure SQL resources in `prod` by default.

## Prerequisites
- Global stamp entry exists in `chitstack.azure.deployment/global.json` and tenant rows exist in `chitstack.azure.deployment/tenants.json` (or control plane after migration).
- GitHub environment secrets are configured for Azure OIDC and SQL admin credentials.
- SKU policy validation passes in CI.

## Steps
1. Add tenant metadata with profile `nonprod-ultra-low` and `prod.enabled=true` (optional `subdomain` for Global registry).
2. Run `provision-tenant.yml` with:
   - `tenantKey`
   - `environment=prod`
   - `confirm=DEPLOY`
   SKUs, `tenantId`, and profile come from `tenants.json`; the workflow always registers the tenant in the Global database after deploy.
3. Verify resources:
   - `rg-chitstack-prod-{tenantKey}`
   - `api-chitstack-prod-{tenantKey}`
   - `web-chitstack-prod-{tenantKey}`
   - `sqldb-chitstack-prod-{tenantKey}`
4. Confirm API health endpoint and baseline DB connectivity.
5. Record onboarding result in deployment history.

## Optional control-plane drift file
If you maintain a snapshot at `chitstack.azure.deployment/tenants.control-plane.json`, CI enforces that enabled tenant keys match `chitstack.azure.deployment/tenants.json` exactly.

## Optional non-prod environments
Use `provision-tenant.yml` with `environment=dev|uat|qa` to add non-prod environments for selected tenants on demand.
