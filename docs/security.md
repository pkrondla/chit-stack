# Security

Security practices for developing, deploying, and publishing ChitStack.

---

## Before publishing to GitHub

**Review and remove secrets from tracked files:**

- Database passwords in `appsettings.json`
- API keys (e.g. Azure Speech, third-party services)
- JWT signing keys used in production
- Any `.env` files with real credentials

**Recommended approach:**

1. Use `appsettings.Development.json` (gitignored) or **.NET User Secrets** for local dev
2. Use **GitHub Environment Secrets** for CD pipelines (`SQL_ADMIN_LOGIN`, `SQL_ADMIN_PASSWORD`, Azure OIDC IDs)
3. Use **Azure Key Vault** for runtime secrets in deployed stamps (provisioned by Bicep)
4. Rotate any credentials that were ever committed to git history

Add sensitive patterns to `.gitignore` if not already present:

```
appsettings.Development.json
appsettings.*.local.json
.env
.env.*
*.pfx
```

---

## Authentication

| Layer | Mechanism |
|-------|-----------|
| API | JWT Bearer tokens |
| Web | Token stored client-side (Zustand auth store); sent via `Authorization` header |
| SignalR | Token passed as `access_token` query parameter on hub connections |

### JWT configuration

Production deployments should set strong, unique values via App Service configuration:

- `Jwt:Key` — signing key (long random secret)
- `Jwt:Issuer` / `Jwt:Audience` — token validation parameters

Never use default development keys in Azure environments.

---

## Authorization

- Role-based access on API controllers (`[Authorize(Roles = "...")]`)
- Frontend route guards in `ProtectedRoute` components
- Separate layouts for staff vs member portal

---

## Network security (Azure)

| Control | Implementation |
|---------|----------------|
| SQL firewall | App Service outbound IP rules (Bicep module `sql-app-outbound-firewall`) |
| Temporary CI access | CD pipelines open a runner-specific firewall rule, then remove it in `always()` cleanup |
| HTTPS | App Service and Static Web Apps serve over TLS |
| CORS | API allows only configured origins (`localhost` in dev, `*.azurestaticapps.net` in Azure) |

---

## Deployment safety

- Infrastructure deploys require typing **`DEPLOY`** exactly — prevents accidental runs
- GitHub **environment protection rules** gate prod/uat/dev/qa approvals
- SKU policy validation in CI blocks disallowed resource tiers in production
- SqlPackage publishes use `BlockOnPossibleDataLoss=true` by default

---

## Database security

- SQL admin credentials stored in GitHub Secrets, passed to Bicep at deploy time
- Connection strings applied to App Service via `configure-stamp-app.ps1` (not baked into artifacts)
- `SeedOnStartup=false` in Azure to avoid re-seeding production data

---

## Observability & incident response

- Application Insights per stamp — no PII in custom log messages without review
- Slice-specific alerting guidance in [observability-slices.md](cicd/observability-slices.md)
- Rollback procedures in [rollback-runbook.md](cicd/rollback-runbook.md)

---

## Reporting vulnerabilities

If you publish this as a portfolio project, add a contact method for security reports (email or GitHub Security Advisories). Do not open public issues with exploit details.
