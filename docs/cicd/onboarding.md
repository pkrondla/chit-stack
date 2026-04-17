# Tenant Onboarding Runbook

## Goal
Provision a new tenant with isolated web, API, and Azure SQL resources in `prod` by default.

## Prerequisites
- Tenant entry exists in `deployment/tenants.json` (or control plane after migration).
- GitHub environment secrets are configured for Azure OIDC and SQL admin credentials.
- SKU policy validation passes in CI.

## Steps
1. Add tenant metadata with profile `nonprod-ultra-low` and `prod.enabled=true` (optional `subdomain` for Global registry).
2. Run `provision-tenant.yml` with:
   - `tenantKey`
   - `environment=prod`
   - `profile=nonprod-ultra-low` (or override)
   - `fixedTenantId` aligned with the tenant database row (defaults to `1` when a single tenant row exists)
   - `registerInGlobal` left enabled to upsert `dbo.Tenants` in the Global database
3. Verify resources:
   - `rg-chit-prod-tenant-{tenantKey}`
   - `api-chit-prod-{tenantKey}`
   - `web-chit-prod-{tenantKey}`
   - `sqldb-chit-prod-{tenantKey}`
4. Confirm API health endpoint and baseline DB connectivity.
5. Record onboarding result in deployment history.

## Optional control-plane drift file
If you maintain a snapshot at `deployment/tenants.control-plane.json`, CI enforces that enabled tenant keys match `deployment/tenants.json` exactly.

## Optional non-prod environments
Use `provision-environment.yml` to add `dev`, `uat`, or `qa` for selected tenants on demand.
