# ChitStack

**Multi-tenant SaaS platform for chit fund operations** — groups, auctions, collections, accounting, statutory reporting, and member portals — built on .NET 9, React 19, and Azure.

ChitStack demonstrates production-oriented patterns recruiters and engineering teams look for: **Clean Architecture**, **CQRS**, **database-per-tenant isolation**, **Infrastructure as Code (Bicep)**, and **GitHub Actions CI/CD** with manifest-driven Azure provisioning.

---

## Highlights

| Area | What this project shows |
|------|-------------------------|
| **Architecture** | Modular monolith with strict global/tenant slice boundaries (ADR-001) |
| **Backend** | .NET 9, MediatR CQRS, FluentValidation, EF Core, Hangfire, SignalR, JWT auth |
| **Frontend** | React 19, Vite 7, Ant Design, TanStack Query, Zustand, PWA-ready |
| **Data** | SQL Server / Azure SQL, SSDT DACPAC projects as schema source of truth |
| **Cloud** | Azure App Service, Static Web Apps, SQL, Key Vault, App Insights — provisioned via Bicep |
| **CI/CD** | Automated build/test on PR; manual, approval-gated stamp deployments to Azure |

---

## Solution structure

```
chit-stack/
├── chitstack.global/          # Control-plane slice (tenant registry, global auth)
│   ├── chitstack.global.api
│   ├── chitstack.global.application
│   ├── chitstack.global.domain
│   ├── chitstack.global.infrastructure
│   ├── chitstack.global.database   # SSDT / DACPAC
│   └── chitstack.global.web        # React admin portal
│
├── chitstack.tenant/          # Per-tenant business slice
│   ├── chitstack.tenant.api
│   ├── chitstack.tenant.application
│   ├── chitstack.tenant.domain
│   ├── chitstack.tenant.infrastructure
│   ├── chitstack.tenant.database   # SSDT / DACPAC
│   └── chitstack.tenant.web        # React operations + member portal
│
├── chitstack.azure/           # IaC + deployment manifests + scripts
│   ├── iac/                   # Bicep modules (global/tenant stamps)
│   └── deployment/            # global.json, tenants.json, policies
│
├── .github/workflows/         # CI and CD pipelines
└── docs/                      # Architecture, CI/CD, runbooks
```

Open `ChitStack.sln` in Visual Studio or VS Code to work across all .NET projects.

---

## Domain capabilities (tenant slice)

The tenant application covers end-to-end chit fund operations:

- **Chit groups & tickets** — create groups, enroll members, allocate tickets, manage vacancies
- **Live auctions** — scheduling, bidding (including proxy bids), lottery, real-time updates via SignalR
- **Collections** — agent routes, payment collection, submission reconciliation
- **Finance** — chart of accounts, journal entries, vouchers, payouts, bank reconciliation, penalties
- **Reporting** — P&L, balance sheet, subscriber ledger, arrears, auditor summaries, statutory forms (PDF via QuestPDF)
- **Member portal** — passbook, payments, auctions, profile
- **Agent mobile workflows** — route management, on-field collection
- **Admin** — users, branches, notifications, automation rules, Azure Speech integration for voice features

The **global slice** provides tenant registry, global authentication, and cross-tenant administration.

---

## Tech stack

### Backend
- .NET 9, ASP.NET Core Web API
- MediatR 14 (CQRS), FluentValidation 12, AutoMapper 16
- Entity Framework Core 9 + SQL Server
- Hangfire 1.8 (background jobs)
- SignalR (live auctions, notifications)
- Serilog, Swagger/OpenAPI
- QuestPDF (document generation)

### Frontend
- React 19, Vite 7
- Ant Design 6, Tailwind CSS 4
- TanStack React Query 5, Zustand 5
- React Router 7, Axios, SignalR client
- PWA support (vite-plugin-pwa)

### Infrastructure & DevOps
- Azure Bicep (modular stamp templates)
- GitHub Actions (CI + manual CD)
- SqlPackage DACPAC deployments
- Azure OIDC federated credentials (no long-lived deploy secrets in workflows)

---

## Quick start

**Prerequisites:** .NET 9 SDK, Node.js 20+, SQL Server (local or Express), PowerShell 7+

```bash
# Restore and build the full solution
dotnet restore ChitStack.sln
dotnet build ChitStack.sln -c Release

# Publish databases locally (requires SqlPackage / SSDT build tools)
dotnet build chitstack.global/chitstack.global.database/ChitStack.Database.Global.sqlproj -c Release
dotnet build chitstack.tenant/chitstack.tenant.database/ChitStack.Database.Tenant.sqlproj -c Release

# Run APIs (separate terminals)
dotnet run --project chitstack.global/chitstack.global.api
dotnet run --project chitstack.tenant/chitstack.tenant.api

# Run frontends (separate terminals)
cd chitstack.global/chitstack.global.web && npm ci && npm run dev
cd chitstack.tenant/chitstack.tenant.web && npm ci && npm run dev
```

Configure SQL connection strings in each API's `appsettings.Development.json` (use User Secrets — do not commit credentials). See [Getting Started](docs/getting-started.md) for full setup.

---

## CI/CD at a glance

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR + push to `main` | Validate manifests, build, test, publish artifacts |
| `provision-global.yml` | Manual | Deploy global stamp (infra + DB + API + web) |
| `provision-tenant.yml` | Manual | Deploy one tenant stamp |
| `deploy-infra.yml` | Reusable | Bicep-only infrastructure deploy |

Deployments are **manual and approval-gated** — merging to `main` does not auto-deploy to Azure. Each provision workflow requires typing `DEPLOY` as confirmation.

Full details: [CI/CD documentation](docs/cicd/README.md)

---

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Local development setup |
| [Architecture Overview](docs/architecture/overview.md) | System design, slices, data model |
| [CI/CD Guide](docs/cicd/README.md) | Pipelines, manifests, deployment flow |
| [Azure Setup](docs/deployment/azure-setup.md) | Prerequisites for cloud deployment |
| [Database Projects](DATABASE_PROJECTS.md) | SSDT conventions and DACPAC workflow |
| [Security](docs/security.md) | Secrets, auth, and operational security |
| [ADR-001: Slice Boundaries](docs/architecture/adr-001-modular-monolith-boundaries.md) | Modular monolith dependency rules |

Additional runbooks live under `docs/cicd/` (onboarding, rollback, operations checklists).

---

## Architecture diagram

```
                    ┌─────────────────────────────────────┐
                    │         Global slice (control)       │
                    │  Global Web ──► Global API ──► Global DB │
                    │         (tenant registry)            │
                    └─────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
     ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
     │  Tenant A stamp  │    │  Tenant B stamp  │    │  Tenant N stamp  │
     │  Web + API + SQL │    │  Web + API + SQL │    │  Web + API + SQL │
     └─────────────────┘    └─────────────────┘    └─────────────────┘
```

Each **stamp** is an isolated Azure resource group: Static Web App, App Service, Azure SQL database, Key Vault, and Application Insights — defined in Bicep and driven by JSON manifests.

---

## For recruiters & reviewers

**Suggested review path (30–45 minutes):**

1. Read this README and [Architecture Overview](docs/architecture/overview.md)
2. Skim `chitstack.tenant.application/Features/` for CQRS feature organization
3. Open `chitstack.tenant/chitstack.tenant.web/src/App.jsx` for frontend routing and role-based access
4. Review `.github/workflows/ci.yml` and `provision-tenant.yml` for DevOps maturity
5. Inspect `chitstack.azure/iac/main.bicep` for IaC structure

**Key engineering decisions:**
- Database-per-tenant stamp for isolation and independent scaling
- DACPAC-first schema management (EF Core for runtime data access only)
- Manifest-driven SKU profiles with policy validation in CI
- Slice boundaries enforced to prevent global ↔ tenant coupling

---

## License

Specify your license before publishing (e.g. MIT, Apache 2.0, or proprietary). This repository does not include a license file by default.

---

## Author

Portfolio project demonstrating full-stack SaaS engineering on Microsoft Azure.
