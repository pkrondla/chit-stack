# Baseline Smoke Matrix

## Build baseline
- `dotnet build ChitStack.sln -c Release`
- publish global API
- publish tenant API

## Global critical flow smoke checks
- Global login (`GlobalLogin`)
- Global tenant listing and creation
- Global user listing and creation

## Tenant critical flow smoke checks
- Tenant login / token validation
- Member notifications (in-portal + background dispatch)
- Daily notification job scheduling and execution
- Journal entry creation and account resolution
- PDF generation endpoints used by tenant operations

## Evidence policy
- Each migration PR includes:
  - CI run link
  - build + test summary
  - smoke checklist result (pass/fail)
  - rollback note
