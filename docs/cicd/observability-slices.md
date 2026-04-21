# Observability by Slice

## Logging and telemetry split
- Global API emits telemetry with `slice=global`.
- Tenant API emits telemetry with `slice=tenant` and `tenantId` where available.

## Alerting guidance
- Global alerts: auth failures, global API 5xx spikes, global DB failures.
- Tenant alerts: tenant API 5xx spikes, background queue failures, tenant DB failures.

## Incident triage
1. Identify impacted slice from logs/alerts.
2. Validate corresponding deployment workflow run.
3. Execute slice-specific rollback path first.
4. Use full rollback only if shared components are implicated.
