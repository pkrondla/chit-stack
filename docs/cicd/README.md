# CI/CD Guide

ChitStack uses **GitHub Actions** for continuous integration and **manual, approval-gated** continuous delivery to Azure.

---

## Pipeline overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AUTOMATIC (CI)                           │
│  pull_request / push to main  ──►  ci.yml                       │
│    • validate deployment manifests                               │
│    • dotnet build + test                                         │
│    • publish API artifacts                                       │
│    • build React frontends                                       │
│    • build DACPAC database artifacts                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      MANUAL (CD)                                 │
│  workflow_dispatch  ──►  provision-global.yml                   │
│                       ──►  provision-tenant.yml                  │
│    • resolve SKUs from JSON manifests                            │
│    • build fresh artifacts                                       │
│    • deploy Bicep infrastructure (reusable deploy-infra.yml)     │
│    • publish DACPAC to Azure SQL                                 │
│    • deploy API + configure app settings                         │
│    • deploy Static Web App                                       │
│                                                                  │
│  workflow_dispatch  ──►  teardown-stamp.yml                      │
│    • delete global or tenant resource group (stops SQL billing)  │
│    • confirm=DELETE required                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Important:** Merging to `main` does **not** deploy to Azure. CD is always an explicit workflow run with `confirm=DEPLOY` (provision) or `confirm=DELETE` (teardown).

---

## Workflows reference

### `ci.yml` — CI: Build & Validate

**Triggers:** `pull_request`, `push` to `main`

| Job | Purpose | Condition |
|-----|---------|-----------|
| `changes` | Path filter for global/tenant code paths | Always |
| `validate-config` | Run `validate-config.ps1` on deployment manifests | Always |
| `build-dotnet` | Restore, build, test full solution; publish both APIs | After validate-config |
| `build-global-slice` | Build global API project only | Global paths changed |
| `build-tenant-slice` | Build tenant API project only | Tenant paths changed |
| `build-global-web` | `npm ci && npm run build` | Always |
| `build-tenant-web` | `npm ci && npm run build` | Always |
| `build-dacpac` | Build Global + Tenant SQL projects | Always |

**Artifacts** (1-day retention): `global-api-package`, `tenant-api-package`, `global-web-dist`, `tenant-web-dist`, `global-dacpac`, `tenant-dacpac`

CI artifacts are **not consumed by CD** — provision workflows rebuild from the checked-out commit.

---

### `provision-global.yml` — CD: Provision Global

**Trigger:** Manual (`workflow_dispatch`) or `workflow_call`

**Inputs:**

| Input | Description | Default |
|-------|-------------|---------|
| `environment` | `dev`, `qa`, `uat`, `prod` | `prod` |
| `confirm` | Must be exactly `DEPLOY` | — |

**Jobs:**

1. **`resolve-profile`** — Read `global.json` + `tenants.json` profiles; output SKUs
2. **`build`** (Windows) — Publish global API, build DACPAC, build global web with `VITE_API_BASE_URL`
3. **`deploy-infra`** — Call `deploy-infra.yml` with `scope=global`
4. **`deploy-db-api-web`** — DACPAC publish, API deploy, app settings, SWA deploy

**Target resource group:** `rg-chitstack-{environment}-global`

---

### `provision-tenant.yml` — CD: Provision Tenant

**Trigger:** Manual (`workflow_dispatch`) or `workflow_call`

**Inputs:**

| Input | Description |
|-------|-------------|
| `tenantKey` | Key from `tenants.json` (e.g. `tenant1`) |
| `environment` | `dev`, `qa`, `uat`, `prod` |
| `confirm` | Must be exactly `DEPLOY` |

**Jobs:** Same pattern as global, plus:

- Resolves `fixedTenantId` from `tenants.json`
- Configures `TenantStamp__EnableFixedTenant` and `TenantStamp__FixedTenantId` on the API
- Builds tenant web with `VITE_API_URL` pointing at the tenant API hostname

**Target resource group:** `rg-chitstack-{environment}-{tenantKey}`

---

### `teardown-stamp.yml` — CD: Teardown Stamp

**Trigger:** Manual (`workflow_dispatch`) only

Deletes one stamp **resource group** (SQL server/DB, App Service, Static Web App, Key Vault, App Insights). Use this to stop Azure SQL billing when a demo is idle. Redeploy later with the matching provision workflow.

**Inputs:**

| Input | Description |
|-------|-------------|
| `scope` | `global` or `tenant` |
| `environment` | `dev`, `qa`, `uat`, `prod` |
| `tenantKey` | Required when `scope=tenant` (e.g. `demo`) |
| `confirm` | Must be exactly `DELETE` |

**Behavior:**

- Resolves `rg-{azureResourcePrefix}-{environment}-{global|tenantKey}` from `tenants.json`
- For tenants, `tenantKey` must exist in the manifest (enabled flag is not required)
- Idempotent if the resource group is already gone
- Waits until Azure finishes the delete (SQL billing stops when the group is removed)

**Does not** export databases — back up with a `.bacpac` first if you need the data.

---

### `deploy-infra.yml` — Internal: Deploy Infrastructure

**Trigger:** `workflow_call` only (not run directly)

Deploys Bicep template `chitstack.azure/iac/main.bicep` with parameters:

- `scope` — `global` or `tenant`
- `environment`, `tenantKey`, `resourceGroup`
- `staticWebSku`, `apiPlanSku`, `sqlSku`
- SQL admin credentials from secrets

Creates the resource group if it does not exist (default location: `centralindia`; Static Web Apps in `eastasia`).

---

## Deployment manifests

### `chitstack.azure/deployment/global.json`

Controls the global stamp:

```json
{
  "enabled": true,
  "profile": "nonprod-ultra-low",
  "environments": {
    "prod": { "enabled": true }
  },
  "overrides": {}
}
```

### `chitstack.azure/deployment/tenants.json`

Defines SKU profiles and tenant rows:

```json
{
  "profiles": {
    "nonprod-ultra-low": {
      "staticWebSku": "Free",
      "apiPlanSku": "F1",
      "sqlSku": "Basic"
    }
  },
  "tenants": [
    {
      "tenantKey": "tenant1",
      "tenantId": 1,
      "enabled": true,
      "profile": "nonprod-ultra-low",
      "environments": { "prod": { "enabled": true } }
    }
  ]
}
```

### `chitstack.azure/deployment/policies/sku-policy.json`

Enforces allowed SKUs per environment class (`production` vs `nonProduction`). CI fails if a manifest references a disallowed SKU.

---

## CD deploy sequence (per stamp)

```
1. Resolve profile & SKUs from manifests
2. Build API, DACPAC, web (parallel with infra)
3. Deploy Bicep (App Service, SQL, SWA, KV, App Insights)
4. Open temporary SQL firewall for GitHub runner IP
5. SqlPackage DeployReport → Publish DACPAC
6. Deploy API package (azure/webapps-deploy)
7. Configure app settings (configure-stamp-app.ps1)
8. Deploy Static Web App (SWA CLI + deployment token)
9. Upload DB deploy report artifact
10. Remove temporary SQL firewall rule
```

### Database deployment

- **DeployReport** generated first for audit (`global-deploy-report.xml` / per-tenant report)
- **Publish** with `BlockOnPossibleDataLoss=true`
- Reports uploaded as workflow artifacts

### App settings (post-deploy)

`configure-stamp-app.ps1` sets:

- Connection strings (`ConnectionStrings__GlobalDBConnection` or `ConnectionStrings__TenantDBConnection`)
- `SeedOnStartup=false` in Azure
- `TenantStamp__*` for tenant stamps
- Application Insights connection string when available

---

## GitHub configuration required

### Repository secrets (per environment)

Configure under **Settings → Environments → {dev|qa|uat|prod}**:

| Secret | Purpose |
|--------|---------|
| `AZURE_CLIENT_ID` | OIDC app registration client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Target subscription |
| `SQL_ADMIN_LOGIN` | SQL Server admin username |
| `SQL_ADMIN_PASSWORD` | SQL Server admin password |

### Azure OIDC setup

1. Create an App Registration in Azure AD
2. Configure federated credentials for GitHub (`repo:OWNER/REPO:environment:prod`)
3. Grant the app's service principal **Contributor** on the subscription or resource groups
4. Enable environment protection rules and required reviewers for production

See [Azure Setup](../deployment/azure-setup.md) for step-by-step guidance.

---

## Rollout order

1. Ensure `ci.yml` is green on the commit you intend to deploy
2. Run **CD - Provision Global** for the target environment
3. Run **CD - Provision Tenant** for each tenant key
4. Execute post-deploy checks from [operations-checklists.md](operations-checklists.md)

For new tenants, see [onboarding.md](onboarding.md).

---

## Observability

| Slice | Telemetry tag | Alert focus |
|-------|---------------|-------------|
| Global | `slice=global` | Auth failures, global API 5xx, global DB |
| Tenant | `slice=tenant`, `tenantId` | Tenant API 5xx, Hangfire queue failures, tenant DB |

Details: [observability-slices.md](observability-slices.md)

---

## Rollback

CD does not auto-rollback. On failure:

1. Stop overlapping deploys to the same stamp
2. Redeploy a known-good commit via the provision workflow
3. For schema issues, prefer forward-fix migrations over PITR

Full runbook: [rollback-runbook.md](rollback-runbook.md)

---

## Local validation (CI parity)

```powershell
# Manifest validation
./chitstack.azure/deployment/scripts/validate-config.ps1

# Optional drift check (if control-plane snapshot exists)
./chitstack.azure/deployment/scripts/validate-deployment-sources.ps1
```

---

## Related documents

| Document | Description |
|----------|-------------|
| [architecture.md](architecture.md) | Short deployment units reference |
| [onboarding.md](onboarding.md) | New tenant provisioning |
| [operations-checklists.md](operations-checklists.md) | Pre/post deploy checklists |
| [rollback-runbook.md](rollback-runbook.md) | Incident response |
| [Azure Setup](../deployment/azure-setup.md) | First-time cloud setup |
| [DATABASE_PROJECTS.md](../../DATABASE_PROJECTS.md) | DACPAC authoring |
