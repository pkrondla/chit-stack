# Database Projects Guide

This repository now treats the SQL database projects as the source of truth for database shape and baseline seed state:

- `ChitStack.Database.Global`
- `ChitStack.Database.Tenant`

## Folder conventions

- `RunOnce/`
  - Declarative baseline schema objects that belong in the database model.
  - These scripts should define tables, keys, constraints, and required indexes.
- `Seeds/`
  - Idempotent baseline/reference data scripts executed from `PostDeploy.sql`.
  - Use `IF NOT EXISTS` / guarded inserts and updates.
- `Versioned/`
  - Manual release-to-release upgrade scripts and data backfills.
  - These are intentionally not part of the SQL project build model.
- `PostDeploy.sql`
  - The ordered entrypoint for baseline seed execution.

## Authoring rules

- Add new schema objects under `RunOnce/`.
- Keep one primary object per script where practical.
- Required application defaults must live in SQL seed assets, not only in C# startup code.
- Seed scripts must be safe to execute more than once.
- Environment-specific credentials or real production users must not be hard-coded in seed scripts.
- Use `Versioned/` for release migrations, backfills, and one-off upgrade logic that should not become part of the baseline model.
- When a versioned change becomes part of the long-term baseline, fold it into `RunOnce/` and retain the old versioned script only for upgrading existing environments.

## Seed tracking

Both databases include a `SeedHistory` table reserved for explicit release-seed tracking when CI/CD execution is introduced.

Until a deployment runner is added:

- baseline seed scripts stay idempotent by checking live data
- versioned scripts should be named and executed explicitly

## CI/CD execution model

GitHub Actions deployments should follow this order:

1. Build Global and Tenant DACPAC artifacts once in CI.
2. Deploy Global DACPAC once per target environment.
3. Deploy Tenant DACPAC once per tenant stamp per environment.
4. Capture `SqlPackage` publish output as build artifacts for audit.

Recommended `SqlPackage` usage in deployment jobs:

- Generate deploy report first (`/Action:DeployReport`) for review.
- Run publish with explicit `TargetServerName` and `TargetDatabaseName`.
- Block destructive changes by default unless approved change window exists.

## EF migration decommission checklist

Do not remove EF migration ownership until all of the following are true:

1. A brand-new Global database can be created from `ChitStack.Database.Global` alone.
2. A brand-new Tenant database can be created from `ChitStack.Database.Tenant` alone.
3. Required baseline/reference data exists after SQL project publish plus `PostDeploy.sql`.
4. Existing databases can be upgraded safely using database-project publish/versioned scripts.
5. No required schema creation is left in:
   - `ChitStack.Global.API/Program.cs`
   - `ChitStack.API/Program.cs`
   - `ChitStack.Infrastructure/Data/Seeding/InitialDataSeeder.cs`

Only after those checks pass should the team remove:

- `Database.Migrate()`
- `EnsureCreated()`
- EF migration files used only for schema ownership

EF Core may still remain for data access after migration ownership is retired.
