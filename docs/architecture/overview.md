# Architecture Overview

ChitStack is a **multi-tenant SaaS platform** for managing chit fund operations. It is structured as a **modular monolith** with two primary vertical slices — **global** (control plane) and **tenant** (business operations) — each with its own API, web app, and database.

---

## Design goals

1. **Tenant isolation** — Each tenant runs in a dedicated Azure stamp with its own SQL database, API, and web frontend.
2. **Clear boundaries** — Global and tenant codebases do not reference each other; shared concepts live in minimal kernel/contracts only.
3. **Operational safety** — Schema is owned by SSDT database projects (DACPAC); deployments are manifest-driven and policy-gated.
4. **Incremental complexity** — Start as a modular monolith; slices can evolve toward separate deployable units without a big-bang rewrite.

---

## High-level topology

```
┌──────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                          │
│  chitstack.global.*  │  chitstack.tenant.*  │  chitstack.azure   │
└──────────────────────────────────────────────────────────────────┘
                                │
                    CI (automatic) │ CD (manual)
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Azure (per stamp)                         │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   │
│  │ Static Web  │───►│ App Service │───►│ Azure SQL Database  │   │
│  │   (React)   │    │  (.NET API) │    │                     │   │
│  └─────────────┘    └─────────────┘    └─────────────────────┘   │
│         │                  │                      │               │
│         └──────────────────┴──────────────────────┘               │
│                    Key Vault · App Insights · Log Analytics       │
└──────────────────────────────────────────────────────────────────┘
```

### Global stamp (one per environment)

- **Purpose:** Tenant registry, global user administration, cross-tenant control-plane APIs
- **Resource group:** `rg-chitstack-{environment}-global`
- **Database:** `sqldb-chitstack-{environment}-global`

### Tenant stamp (one per tenant per environment)

- **Purpose:** Full chit fund operations for a single organization
- **Resource group:** `rg-chitstack-{environment}-{tenantKey}`
- **Database:** `sqldb-chitstack-{environment}-{tenantKey}`
- **Fixed tenant mode:** In Azure, each stamp serves exactly one tenant (`TenantStamp:EnableFixedTenant=true` with a configured `FixedTenantId`)

---

## Backend architecture (Clean Architecture + CQRS)

Each slice follows the same layered structure:

```
API (composition root)
  └── Application (MediatR handlers, validators, DTOs)
        └── Domain (entities, enums, domain rules)
        └── Infrastructure (EF Core, external services, Hangfire jobs)
```

### API layer (`*.api`)

- ASP.NET Core controllers (tenant slice has 17+ controllers by domain area)
- Middleware: authentication, branch/tenant context, exception handling
- SignalR hubs for live auctions and notifications
- Hangfire dashboard and job registration
- Swagger/OpenAPI in development

### Application layer (`*.application`)

- **Commands** and **Queries** organized under `Features/{Area}/`
- MediatR pipeline for request dispatch
- FluentValidation for input validation
- AutoMapper for entity ↔ DTO mapping

Example feature areas (tenant):

| Area | Examples |
|------|----------|
| ChitGroups | Create group, launch group, list groups |
| Auctions | Schedule, start, place bid, close, lottery |
| Collections | Agent routes, submissions, reconciliation |
| Financials | Journal entries, penalties, reconciliation |
| Reporting | P&L, balance sheet, subscriber register, GSTR |
| Members | Registration, portal access, nominees, guarantors |
| Auth | OTP, JWT token issuance |

### Domain layer (`*.domain`)

Pure domain entities with no infrastructure dependencies. Tenant domain includes 24+ entities such as `ChitGroup`, `Auction`, `Member`, `Ticket`, `JournalEntry`, `CollectionRoute`, and `Notification`.

### Infrastructure layer (`*.infrastructure`)

- EF Core `DbContext` and repositories
- JWT token services
- PDF generation (QuestPDF)
- Background job implementations
- Azure service integrations (e.g. speech synthesis on tenant API)

---

## Frontend architecture

Both web apps use **React 19 + Vite 7**:

| App | Language | UI | State |
|-----|----------|-----|-------|
| `chitstack.global.web` | TypeScript | Ant Design | Zustand + TanStack Query |
| `chitstack.tenant.web` | JavaScript | Ant Design + Tailwind | Zustand + TanStack Query |

### Tenant web — role-based routing

Routes are protected by role (`Admin`, `Staff`, `Manager`, `Auditor`, `Agent`, `Member`):

- **Operations** — groups, members, auctions, finance, reports
- **Agent** — route collection, passbook, payment capture
- **Member portal** — separate layout for subscribers
- **Admin** — users, auditor dashboard, notifications, reconciliation

Real-time auction updates use the **SignalR** client (`@microsoft/signalr`).

### Theming

Design tokens live in `src/theme/tokens.js` per app. A lint guard (`npm run lint:theme`) prevents hardcoded hex colors in page components. See [THEMING.md](../../THEMING.md).

---

## Data architecture

### Two database projects (source of truth for schema)

| Project | Purpose |
|---------|---------|
| `ChitStack.Database.Global` | Global control-plane schema |
| `ChitStack.Database.Tenant` | Per-tenant business schema |

Folder conventions (both projects):

| Folder | Purpose |
|--------|---------|
| `RunOnce/` | Baseline schema objects (tables, keys, indexes) |
| `Seeds/` | Idempotent reference data (via `PostDeploy.sql`) |
| `Versioned/` | Manual upgrade scripts between releases |

EF Core is used for **runtime data access**; schema changes are applied via **DACPAC publish** in CD pipelines, not EF migrations at deploy time.

See [DATABASE_PROJECTS.md](../../DATABASE_PROJECTS.md) for authoring rules.

---

## Authentication & authorization

- **JWT Bearer** tokens issued by global and tenant auth endpoints
- Role claims drive API authorization and frontend route guards
- SignalR connections pass tokens via query string for hub endpoints
- CORS configured to allow localhost (dev) and `*.azurestaticapps.net` (prod)

---

## Background processing

**Hangfire** runs on SQL Server storage in both APIs:

- Tenant queues: `tenant-default`, `tenant-notifications`, `tenant-maintenance`
- Used for scheduled notifications, maintenance heartbeats, and async work

---

## Azure infrastructure (Bicep)

`chitstack.azure/iac/main.bicep` dispatches to stamp modules:

| Module | Resources |
|--------|-----------|
| `static-web` | Azure Static Web App |
| `app-service` | App Service Plan + API web app |
| `sql` | SQL Server + database |
| `sql-app-outbound-firewall` | Restrict SQL access to App Service outbound IPs |
| `key-vault` | Secrets management |
| `observability` | Log Analytics + Application Insights |

Parameters (SKUs, environment, tenant key) come from deployment manifests resolved at CD time.

---

## Slice dependency rules (ADR-001)

```
✅ chitstack.tenant.api → tenant.application → tenant.domain
✅ chitstack.global.api → global.application → global.domain

❌ tenant → global (forbidden)
❌ global → tenant (forbidden)
❌ shared → global or tenant (forbidden)
```

API projects are **composition roots only** — no business logic in controllers beyond HTTP concerns.

Full ADR: [adr-001-modular-monolith-boundaries.md](adr-001-modular-monolith-boundaries.md)

---

## Deployment configuration

Runtime deployment is driven by JSON manifests:

| File | Role |
|------|------|
| `chitstack.azure/deployment/global.json` | Global stamp enablement, profile, per-environment toggles |
| `chitstack.azure/deployment/tenants.json` | Tenant list, `tenantId`, profiles, environment toggles |
| `chitstack.azure/deployment/policies/sku-policy.json` | Allowed Azure SKUs per environment class |

CI validates these files on every PR. CD workflows resolve SKUs and provision stamps from them.

---

## Observability

- Application Insights per stamp (connection string applied post-deploy)
- Structured logging via Serilog
- Slice-tagged telemetry: `slice=global` vs `slice=tenant`

See [observability-slices.md](../cicd/observability-slices.md).

---

## Related documents

- [Getting Started](../getting-started.md)
- [CI/CD Guide](../cicd/README.md)
- [Azure Setup](../deployment/azure-setup.md)
- [Baseline Smoke Matrix](baseline-smoke-matrix.md)
