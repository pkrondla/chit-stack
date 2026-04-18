# Rollback Runbook

## Trigger conditions
- Deployment health checks fail
- Elevated error rate after release
- Critical tenant functionality regression

## Rollback actions
1. Cancel or let finish any in-flight **Actions** runs that are still deploying tenants (avoid overlapping deploys to the same stamp).
2. Redeploy previous known-good API/web artifacts.
3. If SKU upgrade caused instability, revert to prior SKU only when allowed by policy.
4. Re-run smoke checks:
   - authentication
   - key business transactions
   - report generation
5. Record root cause and remediation items.

## Database
- Prefer forward-fix migrations for schema issues.
- Use PITR only for severe incidents and after explicit approval.
