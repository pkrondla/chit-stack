# ADR-001: Modular Monolith Slice Boundaries

## Status
Accepted

## Context
The codebase is migrating from a monolithic layout into a boundary-enforced modular monolith:
- global slice
- tenant slice
- minimal shared kernel/contracts

The architecture requires strict dependency rules to prevent cross-slice drift.

## Decision
1. Tenant slice must not reference global slice projects.
2. Global slice must not reference tenant slice projects.
3. Shared projects must never depend on global or tenant projects.
4. API projects are composition roots only and should contain no business logic.
5. `chitstack.application.shared` and `ChitStack.Infrastructure` remain transitional compatibility shells until extraction is complete.

## Allowed dependency graph
- `chitstack.global.api` -> global application + global/shared infrastructure
- `chitstack.tenant.api` -> tenant application + tenant/shared infrastructure
- global/tenant application -> owning domain + shared kernel/contracts
- global/tenant infrastructure -> owning domain + shared kernel/contracts

## Consequences
- Short-term duplication/adapters are allowed when they preserve behavior and support incremental extraction.
- CI and architecture tests must enforce the rules above.
- New features should be implemented in owning slices, not compatibility shells.
