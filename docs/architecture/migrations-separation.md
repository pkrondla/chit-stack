# Database Migration Separation

## Ownership model
- Global schema changes are owned by `chitstack.global.database`.
- Tenant schema changes are owned by `chitstack.tenant.database`.

## Deployment mapping
- Global deployment workflows run only global DACPAC migration/deploy steps.
- Tenant deployment workflows run only tenant DACPAC migration/deploy steps.

## Rules
1. Do not add tenant schema changes to global database project.
2. Do not add global schema changes to tenant database project.
3. CI must build both database projects in full-solution mode.
4. Environment deploy jobs must target the correct stamp database only.
