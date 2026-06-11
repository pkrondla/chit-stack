# Azure Setup

Prerequisites and first-time configuration for deploying ChitStack to Azure via GitHub Actions.

---

## What gets deployed

Each **stamp** (global or tenant) creates an isolated resource group containing:

| Resource | Naming pattern | Purpose |
|----------|----------------|---------|
| Resource Group | `rg-chitstack-{env}-{tenantKey\|global}` | Isolation boundary |
| Static Web App | `web-chitstack-{env}-{key}` | React frontend |
| App Service Plan + API | `plan-...`, `api-chitstack-{env}-{key}` | .NET API |
| SQL Server + DB | `sql-...`, `sqldb-chitstack-{env}-{key}` | Azure SQL |
| Key Vault | `kv-chitstack-{env}-{key}` | Secrets (provisioned, used for future expansion) |
| App Insights + Log Analytics | `ai-...`, `law-...` | Telemetry |

Default regions:
- Workload resources: `centralindia`
- Static Web Apps: `eastasia` (regional availability constraint)

---

## Prerequisites

### Azure

- Active Azure subscription
- Permissions to create resource groups, App Services, SQL, Static Web Apps, Key Vault, and Monitor resources
- SQL Server admin credentials (strong password; store securely)

### GitHub

- Repository hosted on GitHub
- Admin access to configure environments, secrets, and Actions

### Local (optional)

- Azure CLI (`az`) for manual verification
- PowerShell 7+ for running deployment scripts locally

---

## Step 1: Configure deployment manifests

### Enable global stamp

Edit `chitstack.azure/deployment/global.json`:

```json
{
  "enabled": true,
  "profile": "nonprod-ultra-low",
  "environments": {
    "prod": { "enabled": true }
  }
}
```

### Add tenants

Edit `chitstack.azure/deployment/tenants.json`:

```json
{
  "tenantKey": "acme",
  "tenantId": 1,
  "displayName": "Acme Chits",
  "enabled": true,
  "profile": "nonprod-ultra-low",
  "environments": {
    "prod": { "enabled": true }
  }
}
```

Each tenant needs a **unique positive integer** `tenantId`.

### Validate locally

```powershell
./chitstack.azure/deployment/scripts/validate-config.ps1
```

Commit manifest changes before deploying.

---

## Step 2: Azure AD app registration (OIDC)

1. In Azure Portal → **Microsoft Entra ID** → **App registrations** → **New registration**
2. Name: `github-chitstack-deploy`
3. Create a **federated credential** per GitHub environment:

   | Field | Value |
   |-------|-------|
   | Entity type | Environment |
   | Organization | Your GitHub org or username |
   | Repository | `chit-stack` |
   | Environment | `prod` (repeat for `dev`, `qa`, `uat`) |

4. Note the **Application (client) ID** and **Directory (tenant) ID**

### Grant permissions

Assign the app registration's service principal one of:

- **Contributor** on the subscription (simplest for portfolio/demo)
- **Contributor** scoped to `rg-chitstack-*` resource groups (least privilege, requires pre-created RGs or custom roles)

---

## Step 3: GitHub environments

Create environments under **Settings → Environments**:

- `dev`
- `qa`
- `uat`
- `prod`

For `prod`, enable:
- Required reviewers
- Deployment branch restrictions (e.g. `main` only)

### Add secrets to each environment

| Secret | Value |
|--------|-------|
| `AZURE_CLIENT_ID` | App registration client ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Target subscription GUID |
| `SQL_ADMIN_LOGIN` | SQL admin username (e.g. `chitstackadmin`) |
| `SQL_ADMIN_PASSWORD` | Strong SQL password |

The same SQL admin credentials are used when Bicep creates SQL servers and when CD publishes DACPACs.

---

## Step 4: First deployment

### Deploy global stamp

1. Go to **Actions** → **CD - Provision Global**
2. Click **Run workflow**
3. Set:
   - `environment`: `prod`
   - `confirm`: `DEPLOY`
4. Approve if environment protection requires it
5. Wait for all jobs to complete

### Deploy tenant stamp(s)

1. **Actions** → **CD - Provision Tenant**
2. Set:
   - `tenantKey`: key from `tenants.json`
   - `environment`: `prod`
   - `confirm`: `DEPLOY`

Repeat for each enabled tenant.

---

## Step 5: Verify deployment

### Azure Portal

Confirm resources exist in:
- `rg-chitstack-prod-global`
- `rg-chitstack-prod-{tenantKey}`

### Smoke checks

| Check | How |
|-------|-----|
| API health | `GET https://api-chitstack-prod-global.azurewebsites.net/swagger` |
| Tenant API | `GET https://api-chitstack-prod-{tenantKey}.azurewebsites.net/swagger` |
| Frontend | Open `https://web-chitstack-prod-{tenantKey}.azurestaticapps.net` |
| Database | Query via Azure Portal Query Editor or SSMS |

Full checklist: [operations-checklists.md](../cicd/operations-checklists.md)

---

## SKU profiles

Profiles in `tenants.json` control cost vs reliability:

| Profile | Static Web | API Plan | SQL | Use case |
|---------|------------|----------|-----|----------|
| `nonprod-ultra-low` | Free | F1 | Basic | Demo, dev, portfolio |
| `prod-min-safe` | Free | B1 | Basic | Light production |

Override per stamp via `overrides` in `global.json` or tenant rows.

Production SKUs must pass `sku-policy.json` validation in CI.

---

## Promoting SKUs

1. Update profile or `overrides` in manifests
2. Merge after CI passes
3. Re-run the provision workflow with `confirm=DEPLOY`
4. Bicep updates App Service plan and SQL tier in place (may cause brief downtime)

Policy blocks downgrades when `allowDowngrade: false`.

---

## Troubleshooting

### Workflow fails at "Confirm infrastructure deployment"

`confirm` must be exactly `DEPLOY` (case-sensitive).

### SQL firewall / DACPAC publish fails

CD opens a temporary firewall rule for the runner IP. If publish still fails:
- Verify SQL admin credentials in GitHub Secrets
- Check SQL server exists in the target resource group
- Review `*-db-deploy-report` workflow artifact

### Static Web App deploy fails

- Confirm `az staticwebapp secrets list` returns a deployment token (RBAC: deploy identity needs access to the SWA resource)
- Verify SWA was created in `eastasia` and name matches `web-chitstack-{env}-{key}`

### API returns 500 after deploy

- Check App Service → Configuration for connection strings
- Verify DACPAC publish succeeded
- Review Application Insights logs for the stamp

### OIDC login fails

- Federated credential must match repo + environment name exactly
- Service principal needs Contributor (or equivalent) on target scope

---

## Cost awareness (portfolio/demo)

The `nonprod-ultra-low` profile uses Free/Basic tiers suitable for demonstrations. Azure SQL Basic and App Service F1 have capacity limits — not intended for high-traffic production.

Monitor costs in Azure Cost Management and tear down resource groups when not needed:

```bash
az group delete --name rg-chitstack-prod-global --yes --no-wait
az group delete --name rg-chitstack-prod-tenant1 --yes --no-wait
```

---

## Related documents

- [CI/CD Guide](../cicd/README.md)
- [Tenant Onboarding](../cicd/onboarding.md)
- [Security](../security.md)
- [Architecture Overview](../architecture/overview.md)
