# Getting Started

This guide walks you through running ChitStack locally for development and exploration.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 9.0.x | Required for APIs and database projects |
| [Node.js](https://nodejs.org/) | 20.x LTS | Required for both web apps |
| SQL Server | 2019+ or Express | LocalDB, Express, or full instance |
| PowerShell | 7+ | Deployment script validation (optional locally) |
| Git | Latest | Clone and branch management |

**Optional:** Visual Studio 2022 or VS Code with C# Dev Kit and SQL Server extensions.

---

## 1. Clone and restore

```bash
git clone <your-repo-url>
cd chit-stack

dotnet restore ChitStack.sln
```

---

## 2. Configure databases

### Create databases

Create two empty databases on your SQL Server instance:

- `ChitLedgerGlobal` — global control-plane data
- `ChitLedgerTenant` — tenant business data

### Connection strings

**Do not commit real credentials.** Use `appsettings.Development.json` or [.NET User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets):

```bash
# Global API
cd chitstack.global/chitstack.global.api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:GlobalDBConnection" "Server=localhost\\SQLEXPRESS;Database=ChitLedgerGlobal;Trusted_Connection=True;TrustServerCertificate=True"

# Tenant API
cd ../../chitstack.tenant/chitstack.tenant.api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:TenantDBConnection" "Server=localhost\\SQLEXPRESS;Database=ChitLedgerTenant;Trusted_Connection=True;TrustServerCertificate=True"
```

Adjust server name and authentication to match your environment.

### Publish schema (DACPAC)

Build the SSDT projects, then publish with SqlPackage:

```bash
dotnet build chitstack.global/chitstack.global.database/ChitStack.Database.Global.sqlproj -c Release
dotnet build chitstack.tenant/chitstack.tenant.database/ChitStack.Database.Tenant.sqlproj -c Release

# Install SqlPackage if needed
dotnet tool install --global microsoft.sqlpackage

sqlpackage /Action:Publish \
  /SourceFile:chitstack.global/chitstack.global.database/bin/Release/ChitStack.Database.Global.dacpac \
  /TargetServerName:localhost \
  /TargetDatabaseName:ChitLedgerGlobal \
  /TargetTrustServerCertificate:True

sqlpackage /Action:Publish \
  /SourceFile:chitstack.tenant/chitstack.tenant.database/bin/Release/ChitStack.Database.Tenant.dacpac \
  /TargetServerName:localhost \
  /TargetDatabaseName:ChitLedgerTenant \
  /TargetTrustServerCertificate:True
```

On Windows, use `sqlpackage.exe` from the .NET tools path or Visual Studio SSDT install.

---

## 3. Run the APIs

Open two terminals:

```bash
# Terminal 1 — Global API (default https://localhost:7xxx — see launchSettings)
dotnet run --project chitstack.global/chitstack.global.api

# Terminal 2 — Tenant API
dotnet run --project chitstack.tenant/chitstack.tenant.api
```

Swagger UI is available in Development at `/swagger` on each API.

### Tenant stamp settings (local)

For local dev, the tenant API typically uses a shared database with `TenantStamp:EnableFixedTenant=false`. In Azure, each stamp uses a dedicated database with a fixed tenant ID. See `appsettings.json` → `TenantStamp` section.

### Seed data

`SeedOnStartup` defaults to `true` in tenant API config. The infrastructure layer seeds baseline account heads and reference data on first run when enabled.

---

## 4. Run the web apps

Open two more terminals:

```bash
# Global admin web (TypeScript)
cd chitstack.global/chitstack.global.web
npm ci
npm run dev

# Tenant operations web
cd chitstack.tenant/chitstack.tenant.web
npm ci
npm run dev
```

Vite prints local URLs (typically `http://localhost:5173`). Configure API base URLs:

| App | Config file | Variable |
|-----|-------------|----------|
| Global web | `.env.development` or Vite env | `VITE_API_BASE_URL` |
| Tenant web | `src/config/apiConfig.js` or env | API URL for tenant backend |

Point each frontend at the corresponding local API `/api` base path.

---

## 5. Build and test (CI parity)

Run the same checks as GitHub Actions CI:

```bash
# Validate deployment manifests
pwsh ./chitstack.azure/deployment/scripts/validate-config.ps1

# Full solution build and test
dotnet build ChitStack.sln -c Release
dotnet test ChitStack.sln -c Release --no-build

# Frontend builds
cd chitstack.global/chitstack.global.web && npm ci && npm run build
cd chitstack.tenant/chitstack.tenant.web && npm ci && npm run build
```

---

## 6. Explore the codebase

| Goal | Start here |
|------|------------|
| Business logic | `chitstack.tenant/chitstack.tenant.application/Features/` |
| API endpoints | `chitstack.tenant/chitstack.tenant.api/Controllers/` |
| Domain model | `chitstack.tenant/chitstack.tenant.domain/Entities/` |
| UI routes | `chitstack.tenant/chitstack.tenant.web/src/App.jsx` |
| Database schema | `chitstack.tenant/chitstack.tenant.database/RunOnce/` |
| Azure IaC | `chitstack.azure/iac/main.bicep` |
| CI/CD | `.github/workflows/ci.yml` |

---

## Common issues

### SQL connection failures

- Verify SQL Server is running and TCP is enabled
- Use `TrustServerCertificate=True` for local dev
- Check firewall rules if using a named instance

### DACPAC publish errors

- Ensure target database exists or allow SqlPackage to create it
- Review `DeployReport` output before `Publish` on shared environments

### CORS errors in browser

- Confirm the frontend origin is allowed (localhost is permitted by default in API CORS policy)
- Match HTTP vs HTTPS between frontend and API

### Hangfire dashboard

Available at `/hangfire` when the API is running (restrict access in production).

---

## Next steps

- [Architecture Overview](architecture/overview.md) — understand slices and data flow
- [CI/CD Guide](cicd/README.md) — deploy to Azure
- [Security](security.md) — handle secrets correctly before publishing
