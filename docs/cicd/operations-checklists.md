# CI/CD Operations Checklists

## Pre-deployment checklist
- [ ] `ci.yml` green
- [ ] Deployment config validation passed
- [ ] Target environment approvals ready
- [ ] Maintenance window communicated (prod)

## Post-deployment checklist
- [ ] API health endpoint success
- [ ] DB connectivity success
- [ ] No spike in error rates
- [ ] Deployment logs archived

## Tenant batch rollout checklist
- [ ] Global deployed first
- [ ] Batch size matches environment policy
- [ ] Failed tenants captured for rerun
- [ ] No blocked tenant left unreported
