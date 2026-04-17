# Stamp Upgrade Runbook

## Goal
Upgrade Global or tenant stamp profile/SKU with minimal interruption.

## Typical transition
- `nonprod-ultra-low` -> `prod-min-safe`
- or explicit SKU overrides for heavy workload stamps

## Steps
1. Change profile or overrides in source-of-truth config.
2. Validate config with `deployment/scripts/validate-config.ps1`.
3. Schedule a low-traffic maintenance window.
4. Run:
   - `upgrade-global.yml` for global
   - `upgrade-tenant.yml` for tenant
5. Confirm:
   - API app restarts successfully
   - SQL connections recover without errors
   - health checks pass
6. Monitor errors/latency for at least 30 minutes.

## Notes
- Azure SQL tier upgrades should preserve data.
- Brief API/DB reconnect events can occur during scaling operations.
