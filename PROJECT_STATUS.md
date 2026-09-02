# OTR-India — Project Status

Live, factual status tracker for the team (human + AI readable). Git history is the source of truth for code — this file just summarizes it.

**Rule: never check a box unless it is actually implemented AND verified working.** If you're not sure, leave it unchecked and add a note.

Last updated: 2026-09-02 (foundation implemented on `feature/priyanshu-foundation` — not yet merged to `main`)

---

## Overall Project Status

Status: **Foundation implemented and verified; ready for the other three modules to build against it.**

`feature/priyanshu-foundation` now contains a working backend (Node/Express/TypeScript + PostgreSQL via Drizzle ORM), a minimal frontend scaffold (Vite/React/TS), the canonical shared schema, an auth boundary, and one fully working vertical slice (register → login → get/update OTR profile). This has been built, tested against a real PostgreSQL instance, and run live — not just written.

Target: complete working prototype by ~September 4, 2026, feature-frozen for presentation prep on September 5–6, presenting September 7.

## Priyanshu (Team Lead — Foundation + Integration)

- [x] Project structure / repo layout (`backend/`, `frontend/`, `docs/`)
- [x] Basic backend setup (Express + TypeScript, builds clean via `tsc`)
- [x] Basic frontend setup (Vite + React + TS, builds clean; placeholder page hits `/api/health`)
- [x] Database connection (PostgreSQL 16, verified live via `/api/health` and the full test suite)
- [x] Common configuration / environment setup (`backend/.env.example`, fail-fast env validation in `src/config/env.ts`)
- [x] Initial API structure (`/api/health`, `/api/auth/register`, `/api/auth/login`, `/api/otr/profile` [GET/PATCH]) — standard `{ success, data }` / `{ success: false, error }` envelope for all modules to reuse
- [x] Shared data models / canonical schema (10 tables per Master Spec §18, proper FK constraints + cascade deletes, migration generated and applied to dev + test databases)
- [x] Basic authentication structure (email/password + JWT boundary; `requireAuth` middleware other modules can reuse; scrypt password hashing)
- [x] Development conventions documented (`docs/ARCHITECTURE_DECISIONS.md`)
- [x] Master Specification drafted
- [x] Team Workflow drafted
- [ ] Integration of all modules (blocked — Harsh/Adi/Anchal haven't started their modules yet)

**Verified, not just written:** `npm run build` (backend) compiles clean. `npm test` — 12/12 Jest tests pass against a real PostgreSQL test database (not mocked). Frontend `npm run build` compiles clean. Manually ran the live server and exercised `/api/health` and `/api/auth/register` with real HTTP requests, confirmed a real JWT + real OTR ID + real DB row were created, then cleaned up the test data.

**Engineering decision made autonomously (documented in `docs/ARCHITECTURE_DECISIONS.md`):** Backend is Node.js + Express + TypeScript (one of the three options Master Spec §28 already allowed). ORM is **Drizzle, not Prisma** — Prisma's client requires a native binary download from `binaries.prisma.sh`, which returned `403` from this build environment's network allowlist. Database is still PostgreSQL; canonical schema shape is unchanged from what was planned.

## Harsh (Government Interoperability + Portal Connectors)

- [ ] Mock Government Portal A (e.g. GovRecruit-A)
- [ ] Mock Government Portal B (e.g. GovRecruit-B), with intentionally different field names
- [ ] Interoperability layer / API gateway
- [ ] Canonical-model ↔ portal field mapping (data mapping layer)
- [ ] Connector/adapter structure

**Now unblocked:** canonical types are defined in `backend/src/types/canonical.ts` — build the mapping layer against that shape. The `users`/`profiles`/`credentials` tables exist and are queryable.

## Adi (Citizen Application + OTR Frontend + Dashboard)

- [ ] OTR profile creation UI
- [ ] Education / credentials entry UI
- [ ] Document upload UI
- [ ] Verification status display
- [ ] "Use OTR" flow on a government portal (consent review → prefill)
- [ ] Dashboard: applications list, status, application IDs
- [ ] Dashboard: consent history / access history views

**Now unblocked:** `frontend/` has a working Vite/React/TS scaffold that already proves it can reach the backend (see `frontend/src/App.tsx` — replace this placeholder, don't build around it). `GET/PATCH /api/otr/profile` are live and tested; register/login are live and tested.

## Anchal (Consent + Document/Data Management + Application Flow)

- [ ] Consent request/grant/deny flow
- [ ] Consent audit trail (who/what/when)
- [ ] Document/credential metadata model
- [ ] Credential verification status simulation (mock issuer)
- [ ] Application-specific data handling (per-application fields, overrides)
- [ ] Application submission + application ID generation

**Now unblocked:** `consents`, `applications`, `application_data`, `access_requests` tables exist in the shared schema (`backend/src/db/schema.ts`) with the field shapes from Master Spec §11–13 — shape only, no business logic. `generateConsentReference()` and `generateApplicationRefId()` already exist in `backend/src/utils/idGenerator.ts`. The `credentials` table + `CredentialStatus` enum (`USER_PROVIDED → PENDING_VERIFICATION → VERIFIED` etc., per §6) exists but has no verification-simulation logic yet.

## Integration

- [ ] Connect frontend + backend (partially — health check only; full integration waits on Adi's real UI)
- [ ] End-to-end OTR flow (Citizen → OTR → Portal A → Consent → Data retrieval → Form prefill → Submit → Application ID → Dashboard)
- [ ] Same flow repeated against Portal B (interoperability demonstrated)
- [ ] Application-specific override demo working
- [ ] Data-minimization demo working (portal receives only requested fields)

## Testing

- [x] Auth tests (valid/invalid login, duplicate email, weak password) — 6 tests, passing against real Postgres
- [x] OTR profile tests (create via register, retrieve, update) — passing against real Postgres
- [x] Security tests (unauthorized access with no token, invalid token) — passing
- [ ] Consent tests (grant/deny/expired-invalid) — Anchal's module
- [ ] Interoperability tests (field mapping, invalid/missing field) — Harsh's module
- [ ] Application tests (create/validate/submit/generate ID) — Anchal's module
- [ ] Full end-to-end integration test (both portals)

## Documentation

- [x] `README.md` (pre-existing)
- [x] `MASTER_SPECIFICATION.md`
- [x] `TEAM_WORKFLOW.md`
- [x] `PRIYANSHU_DEVELOPER_INSTRUCTIONS.md` (repo version)
- [x] `HARSH_DEVELOPER_INSTRUCTIONS.md`, `ADI_DEVELOPER_INSTRUCTIONS.md`, `ANCHAL_DEVELOPER_INSTRUCTIONS.md`
- [x] `PROJECT_STATUS.md` (this file)
- [x] `docs/ARCHITECTURE_DECISIONS.md` (new — stack choice + Prisma→Drizzle deviation, documented per Master Spec §32)
- [ ] API contract reference doc (endpoints exist and are documented inline via route files; a standalone reference doc is still worth doing once Harsh/Anchal's endpoints exist too)
- [ ] Database schema doc beyond the schema file itself

## Known Blockers / Dependencies

- **RESOLVED:** Tech stack — Node.js + Express + TypeScript + PostgreSQL (via Drizzle ORM, not Prisma — see `docs/ARCHITECTURE_DECISIONS.md` §2 for why). Chosen autonomously per team-lead instruction; not a deviation from Master Spec §28's allowed options.
- **RESOLVED:** Initial database schema — 10 tables live in both `otr_india_dev` and a separate `otr_india_test` database, with FK constraints.
- **RESOLVED (partially):** API contracts — `/api/auth/register`, `/api/auth/login`, `GET /api/otr/profile`, `PATCH /api/otr/profile` are live, tested, and documented in code. Contracts for `/api/consent`, `/api/applications`, and Harsh's interoperability endpoints are **not yet defined** — that's each owning developer's call, informed by the shared schema.
- **NEW:** If Harsh, Adi, or Anchal's own Claude/dev environment *can* reach `binaries.prisma.sh` and they'd prefer Prisma for their own module's tooling, that's fine for tooling that doesn't touch shared migrations — but shared schema changes must go through `backend/src/db/schema.ts` (Drizzle). Two ORMs independently generating migrations against the same database would cause real conflicts. Flag here before doing that.
- **NEW:** `feature/priyanshu-foundation` has NOT been merged to `main` yet. Harsh/Adi/Anchal should coordinate with Priyanshu on when to pull this branch's work into their own branches, since `main` itself still only has the documentation commit.
- Branch naming for Harsh/Adi/Anchal not yet finalized in an actual PR/merge (names are proposed in `TEAM_WORKFLOW.md` §6 and Priyanshu's Phase-13 instructions: `feature/harsh-interoperability`, `feature/adi-citizen-ui` or `feature/adi-frontend`, `feature/anchal-consent-data` or `feature/anchal-consent` — team should confirm the exact names once branches are actually created).

## Next Priorities

1. ~~Priyanshu: stand up the minimal project foundation~~ — **done, verified, on `feature/priyanshu-foundation`.**
2. Harsh, Adi, Anchal: pull/reference this branch, confirm your own branch names, and start building your modules against the live API contracts and shared schema described above.
3. Priyanshu: get this branch reviewed and merged to `main` (requires either GitHub push access being set up for this environment, or Priyanshu committing/pushing from his own machine using this branch's changes).
4. Team: agree on `/api/consent` and `/api/applications` contracts (Anchal) and the mock-portal/mapping contract (Harsh) before those modules go deep, per Master Spec §23.
5. Build toward the smallest possible end-to-end path next: Government Portal → Consent → Data Retrieval → Form Prefill → Application Submission → Dashboard (Authentication → OTR Profile already works).

---
*Update this file whenever you complete a meaningful, verified feature, or when your work creates a dependency/blocker for another developer. Keep it factual.*
