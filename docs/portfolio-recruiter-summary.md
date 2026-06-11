# ChitStack — Portfolio Summary

**Multi-tenant SaaS for chit fund operations · .NET 9 · React 19 · Azure**

| | |
|---|---|
| **Author** | Praveen Rondla |
| **Repository** | `chit-stack` |
| **License** | MIT |

---

## What it is

ChitStack is a production-style **multi-tenant SaaS platform** for managing chit funds: subscriber groups, live auctions, field collections, double-entry accounting, statutory reports, and member self-service portals. Each tenant runs in an **isolated Azure stamp** (dedicated API, web app, and SQL database).

---

## Problem → solution

| Challenge | How ChitStack addresses it |
|-----------|----------------------------|
| Multi-tenant isolation | Database-per-tenant stamps on Azure; fixed-tenant mode in production |
| Complex domain (finance + auctions + collections) | CQRS feature modules with 90+ MediatR handlers in the tenant slice |
| Safe schema evolution | SSDT DACPAC projects as schema source of truth; SqlPackage in CD |
| Controlled cloud cost | Manifest-driven SKU profiles with CI policy validation |
| Operational safety | Manual approval-gated deploys; infra requires explicit `DEPLOY` confirmation |

---

## Tech stack (at a glance)

**Backend:** .NET 9 · ASP.NET Core · MediatR (CQRS) · FluentValidation · EF Core 9 · Hangfire · SignalR · JWT · Serilog · QuestPDF

**Frontend:** React 19 · Vite 7 · Ant Design 6 · TanStack Query · Zustand · Tailwind CSS 4 · PWA-ready

**Data:** SQL Server / Azure SQL · SSDT database projects (Global + Tenant DACPACs)

**Cloud & DevOps:** Azure Bicep (IaC) · App Service · Static Web Apps · Key Vault · App Insights · GitHub Actions · Azure OIDC

---

## Architecture highlights

```
Global slice (control plane)     Tenant stamps (one per org)
  Web → API → Global DB            Web → API → Tenant DB  (×N)
```

- **Modular monolith** with enforced global/tenant slice boundaries (ADR-001)
- **Clean Architecture:** API → Application → Domain ← Infrastructure
- **Real-time:** SignalR for live auctions and notifications
- **Background jobs:** Hangfire with named queues per slice

---

## CI/CD highlights

| Pipeline | Trigger | Role |
|----------|---------|------|
| `ci.yml` | Every PR + push to `main` | Validate manifests · build · test · artifact DACPACs & apps |
| `provision-global.yml` | Manual | Deploy global stamp end-to-end |
| `provision-tenant.yml` | Manual | Deploy one tenant stamp end-to-end |

Deploy flow per stamp: **resolve SKUs → Bicep infra → DACPAC publish → API deploy → app settings → Static Web App**

---

## What this demonstrates (for hiring)

- Designing and shipping a **real multi-tenant SaaS** topology, not a single-DB demo app
- **Backend craftsmanship:** CQRS, validation pipelines, domain-driven feature folders
- **Full-stack delivery:** paired .NET APIs and React SPAs with role-based routing
- **Cloud-native ops:** IaC, federated OIDC deploy auth, environment-gated CD, observability per stamp
- **Data discipline:** declarative schema ownership, idempotent seeds, deploy reports before publish

---

## Suggested 20-minute code review

1. `README.md` — scope and structure
2. `chitstack.tenant.application/Features/` — CQRS organization
3. `chitstack.tenant.web/src/App.jsx` — roles and routing
4. `.github/workflows/provision-tenant.yml` — end-to-end CD
5. `chitstack.azure/iac/main.bicep` — infrastructure modules

---

## Links

| Resource | Path |
|----------|------|
| Full README | `/README.md` |
| Architecture | `/docs/architecture/overview.md` |
| CI/CD guide | `/docs/cicd/README.md` |
| Getting started | `/docs/getting-started.md` |

---

*To export as PDF: open this file in VS Code or GitHub, print to PDF (A4, margins normal), or use `npx md-to-pdf docs/portfolio-recruiter-summary.md`.*
