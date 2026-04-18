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

## Multi-tenant rollout checklist (manual)
- [ ] Global deployed first
- [ ] Each tenant deployed via **Provision Tenant** with the correct `tenantKey`
- [ ] Failed tenants captured for rerun
- [ ] No blocked tenant left unreported
