# OTR-India — Project Status

Live, factual status tracker for the team (human + AI readable). Git history is the source of truth for code — this file just summarizes it.

**Rule: never check a box unless it is actually implemented AND verified working.** If you're not sure, leave it unchecked and add a note.

Last updated: 2026-08-31 (documentation setup — no application code has been written yet)

---

## Overall Project Status

Status: **Pre-development / documentation & foundation setup phase.**

At this point the repository contains project documentation (`README.md`, `MASTER_SPECIFICATION.md`, `TEAM_WORKFLOW.md`, `PRIYANSHU_DEVELOPER_INSTRUCTIONS.md`, `PROJECT_STATUS.md`). No frontend, backend, database, or interoperability code has been implemented yet.

Target: complete working prototype by ~September 4, 2026, feature-frozen for presentation prep on September 5–6, presenting September 7.

## Priyanshu (Team Lead — Foundation + Integration)

- [ ] Project structure / repo layout
- [ ] Basic frontend setup
- [ ] Basic backend setup
- [ ] Database connection
- [ ] Common configuration / environment setup (`.env.example`)
- [ ] Initial API structure
- [ ] Shared data models / canonical schema
- [ ] Basic authentication structure
- [ ] Development conventions documented
- [x] Master Specification drafted
- [x] Team Workflow drafted
- [ ] Integration of all modules

## Harsh (Government Interoperability + Portal Connectors)

- [ ] Mock Government Portal A (e.g. GovRecruit-A)
- [ ] Mock Government Portal B (e.g. GovRecruit-B), with intentionally different field names
- [ ] Interoperability layer / API gateway
- [ ] Canonical-model ↔ portal field mapping (data mapping layer)
- [ ] Connector/adapter structure

## Adi (Citizen Application + OTR Frontend + Dashboard)

- [ ] OTR profile creation UI
- [ ] Education / credentials entry UI
- [ ] Document upload UI
- [ ] Verification status display
- [ ] "Use OTR" flow on a government portal (consent review → prefill)
- [ ] Dashboard: applications list, status, application IDs
- [ ] Dashboard: consent history / access history views

## Anchal (Consent + Document/Data Management + Application Flow)

- [ ] Consent request/grant/deny flow
- [ ] Consent audit trail (who/what/when)
- [ ] Document/credential metadata model
- [ ] Credential verification status simulation (mock issuer)
- [ ] Application-specific data handling (per-application fields, overrides)
- [ ] Application submission + application ID generation

## Integration

- [ ] Connect frontend + backend
- [ ] End-to-end OTR flow (Citizen → OTR → Portal A → Consent → Data retrieval → Form prefill → Submit → Application ID → Dashboard)
- [ ] Same flow repeated against Portal B (interoperability demonstrated)
- [ ] Application-specific override demo working
- [ ] Data-minimization demo working (portal receives only requested fields)

## Testing

- [ ] Auth tests (valid/invalid login)
- [ ] OTR profile tests (create/update/retrieve)
- [ ] Consent tests (grant/deny/expired-invalid)
- [ ] Interoperability tests (field mapping, invalid/missing field)
- [ ] Application tests (create/validate/submit/generate ID)
- [ ] Security tests (unauthorized access, invalid token, access without consent)
- [ ] Full end-to-end integration test (both portals)

## Documentation

- [x] `README.md` (pre-existing)
- [x] `MASTER_SPECIFICATION.md`
- [x] `TEAM_WORKFLOW.md`
- [x] `PRIYANSHU_DEVELOPER_INSTRUCTIONS.md` (repo version)
- [x] `PROJECT_STATUS.md` (this file)
- [ ] API contract reference doc (once endpoints are agreed)
- [ ] Database schema doc (once finalized)

## Known Blockers / Dependencies

- Tech stack (backend language/framework: Node/Express vs FastAPI vs Spring Boot) not yet finalized by the team — blocks Harsh/Adi/Anchal from building against a concrete backend.
- Database schema not yet defined — blocks credential, consent, and application data modeling.
- API contracts (`/api/otr/profile`, `/api/consent`, `/api/applications`, etc.) not yet agreed — blocks parallel frontend/backend work.
- Branch naming/strategy needs to be finalized once module boundaries are confirmed.

## Next Priorities

1. Priyanshu: stand up the minimal project foundation (repo structure, basic frontend/backend skeleton, DB connection, env config) so the other three developers have something to branch from.
2. Team: agree on the backend tech stack and initial API contracts before deep parallel work starts.
3. Build the smallest possible end-to-end path first: Authentication → OTR Profile → Government Portal → Consent → Data Retrieval → Form Prefill → Application Submission → Dashboard.
4. Only after that path works should P1/P2 features begin.

---
*Update this file whenever you complete a meaningful, verified feature, or when your work creates a dependency/blocker for another developer. Keep it factual.*
