# ChitStack Documentation

Welcome to the ChitStack documentation. Use this index to navigate the repository.

## Start here

| Document | Audience | Description |
|----------|----------|-------------|
| [Portfolio Summary (1 page)](portfolio-recruiter-summary.md) | Recruiters, reviewers | Printable overview — export to PDF |
| [Getting Started](getting-started.md) | Developers | Run the solution locally |
| [Architecture Overview](architecture/overview.md) | Engineers, reviewers | System design and patterns |
| [CI/CD Guide](cicd/README.md) | DevOps, reviewers | Build, test, and deploy pipelines |
| [Azure Setup](deployment/azure-setup.md) | Platform engineers | Cloud prerequisites and first deploy |
| [Security](security.md) | Everyone | Secrets, auth, and safe operations |

## Architecture

| Document | Description |
|----------|-------------|
| [Overview](architecture/overview.md) | High-level architecture, slices, and data flow |
| [ADR-001: Slice Boundaries](architecture/adr-001-modular-monolith-boundaries.md) | Global vs tenant dependency rules |
| [Migrations Separation](architecture/migrations-separation.md) | Global vs tenant database ownership |
| [Baseline Smoke Matrix](architecture/baseline-smoke-matrix.md) | Post-deploy verification checklist |

## CI/CD & operations

| Document | Description |
|----------|-------------|
| [CI/CD Guide](cicd/README.md) | **Primary CI/CD reference** — pipelines, manifests, flow |
| [CI/CD Architecture](cicd/architecture.md) | Short reference for deployment units and profiles |
| [Tenant Onboarding](cicd/onboarding.md) | Provision a new tenant stamp |
| [Operations Checklists](cicd/operations-checklists.md) | Pre/post deployment checks |
| [Rollback Runbook](cicd/rollback-runbook.md) | Incident response and rollback |
| [Observability](cicd/observability-slices.md) | Logging and alerting by slice |

## Data & infrastructure

| Document | Location | Description |
|----------|----------|-------------|
| Database Projects | [DATABASE_PROJECTS.md](../DATABASE_PROJECTS.md) | SSDT folder conventions, DACPAC workflow |
| Deployment manifests | `chitstack.azure/deployment/` | `global.json`, `tenants.json`, SKU policy |
| Bicep IaC | `chitstack.azure/iac/` | Azure resource templates |
| Theming | [THEMING.md](../THEMING.md) | Frontend design token guidelines |

## Repository map

```
docs/
├── README.md                 ← you are here
├── getting-started.md
├── security.md
├── architecture/
│   ├── overview.md
│   ├── adr-001-modular-monolith-boundaries.md
│   ├── migrations-separation.md
│   └── baseline-smoke-matrix.md
├── cicd/
│   ├── README.md             ← comprehensive CI/CD guide
│   ├── architecture.md
│   ├── onboarding.md
│   ├── operations-checklists.md
│   ├── rollback-runbook.md
│   └── observability-slices.md
└── deployment/
    └── azure-setup.md
```
