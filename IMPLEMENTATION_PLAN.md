# Collection Agent Feature - Implementation Plan

## Current Status: 🟢 In Progress

### Phase 1: Domain & Database Updates ✅

- [x] Create `CollectionRoute` entity.
- [x] Create `CollectionSubmission` entity.
- [x] Update `Member` entity with `CollectionRouteId`.
- [x] Update `Receipt` entity with `Status`, `AgentId`, `PhotoUrl`, `Lat/Long`, `SubmissionId`.
- [x] Update `User` entity with `AssignedRouteId`.
- [x] Register new entities in `IApplicationDbContext`.
- [x] Apply Migrations (manual database update required).

### Phase 2: Backend Logic (Application Layer) 🟢

- [x] `GetRouteMembersQuery`: Fetch members for an agent's route.
- [x] `SubmitCollectionCommand`: Integrated with enhanced `RecordPaymentCommand`.
- [x] `CloseRouteBatchCommand`: Agent marks route as finished.
- [x] `VerifySubmissionCommand`: Staff verifies and posts to General Ledger.
- [x] `GetPassbookQuery`: Multi-role universal passbook logic.
- [x] `GetVacantTicketsQuery`: Fetch available slots for recruitment.
- [x] `ProposeEnrollmentCommand`: Agent-led new member proposal.

### Phase 3: Staff/Admin Portal (Frontend) ✅

- [x] `SubmissionReconciliation`: Verify and Approve agent batches.
- [x] `RouteManagement`: Assign members to routes.
- [x] Map/Dashboard updates for tracking agents.

### Phase 4: Collection Agent PWA (Frontend) ✅

- [x] `AgentDashboard`: Task-centric mobile-first view.
- [x] `AgentRoute`: Leaflet-based stops visualization.
- [x] `CollectPayment`: UPI QR (integrated w/ company UPI), GPS, and Photo Proof.
- [x] `RouteSummary`: Daily wallet close-out.
- [x] `VacantTickets` & `EnrollMember`: Field-based recruitment.
- [x] Universal `Passbook` viewer for members and agents.

### Phase 5: Member Portal & Transparency ✅

- [x] Universal Passbook view.
- [x] "Pending" status visual cues in Member login.
