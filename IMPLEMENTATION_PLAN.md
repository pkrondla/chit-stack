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

### Phase 3: Staff/Admin Portal (Frontend) ⚪

- [ ] Route Management UI (Create/Assign).
- [ ] Agent Tracking Map (Leaflet/OSM).
- [ ] Submission Verification Workflow.

### Phase 4: Agent PWA (Mobile) ⚪

- [ ] PWA Manifest & Service Worker.
- [ ] Route Dashboard (Next Stop/Stop List).
- [ ] Collection Form with GPS & Camera integration.
- [ ] Company UPI QR Modal.
- [ ] Recruitment proposal form.

### Phase 5: Member Portal & Transparency ⚪

- [ ] Universal Passbook view.
- [ ] "Pending" status visual cues in Member login.
