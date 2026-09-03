# OTR-India — Project Status

Live, factual status tracker for the team (human + AI readable). Git history is the source of truth for code — this file just summarizes it.

**Rule: never check a box unless it is actually implemented AND verified working.** If you're not sure, leave it unchecked and add a note.

Last updated: 2026-09-03 (audit-log core/integration infrastructure added on top of the foundation — not yet committed/pushed from this session, see note at the bottom)

---

## Overall Project Status

Status: **Foundation implemented and verified; core/integration layer (audit infrastructure) added; Harsh/Adi/Anchal reported to have started work in parallel on their own branches.**

`feature/priyanshu-foundation` contains a working backend (Node/Express/TypeScript + PostgreSQL via Drizzle ORM), a minimal frontend scaffold (Vite/React/TS), the canonical shared schema, an auth boundary, and one fully working vertical slice (register → login → get/update OTR profile). This has been built, tested against a real PostgreSQL instance, and run live — not just written.

As of 2026-09-03, per the team lead: foundation commit `6f2f377` is pushed to GitHub, and `feature/harsh-connectors`, `feature/adi-frontend`, `feature/anchal-consent-data` have been created from it and pushed, with all three developers reported as having started implementation. This session did not independently verify that Git state (no GitHub write/read access from this environment this session) — it's recorded here as reported, not re-confirmed.

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
- [x] Audit-log core/integration infrastructure: `recordAuditEvent()` / `listAuditEventsForUser()` (`backend/src/modules/audit/`), `GET /api/audit-logs` (auth-required, own-history-only), closed event vocabulary in `auditEvents.ts`. `auth.service.ts` and `otrProfile.service.ts` now persist `LOGIN`/`PROFILE_UPDATED` instead of only console-logging them. See `docs/ARCHITECTURE_DECISIONS.md` §7.
- [ ] Integration of all modules (in progress — Harsh/Adi/Anchal reported as started on their own branches; not yet integrated back into this branch or `main`)

**Verified, not just written:** `npm run build` (backend) compiles clean. `npm test` — 17/17 Jest tests pass against a real PostgreSQL test database (not mocked) — 12 from the original foundation slice + 5 new audit tests (persistence, retrieval ordering, `LOGIN FAILURE` recorded with no `userId`, cross-user isolation, `limit` validation). Frontend `npm run build` compiles clean. Manually ran the live server this session and exercised `/api/auth/register` → `GET /api/audit-logs` with real HTTP requests, then confirmed the row directly via `psql` (`user_id` correctly populated, not null) before cleanup.

**Engineering decision made autonomously (documented in `docs/ARCHITECTURE_DECISIONS.md`):** Backend is Node.js + Express + TypeScript (one of the three options Master Spec §28 already allowed). ORM is **Drizzle, not Prisma** — Prisma's client requires a native binary download from `binaries.prisma.sh`, which returned `403` from this build environment's network allowlist. Database is still PostgreSQL; canonical schema shape is unchanged from what was planned.

## Harsh (Government Interoperability + Portal Connectors)

- [ ] Mock Government Portal A (e.g. GovRecruit-A)
- [ ] Mock Government Portal B (e.g. GovRecruit-B), with intentionally different field names
- [ ] Interoperability layer / API gateway
- [ ] Canonical-model ↔ portal field mapping (data mapping layer)
- [ ] Connector/adapter structure

**Now unblocked:** canonical types are defined in `backend/src/types/canonical.ts` — build the mapping layer against that shape. The `users`/`profiles`/`credentials` tables exist and are queryable. When your connector accesses citizen data on a portal's behalf, call `recordAuditEvent({ event: 'DATA_ACCESSED', ... })` from `backend/src/modules/audit/audit.service.ts` rather than inventing your own logging — see `docs/API_CONTRACTS.md`.

## Adi (Citizen Application + OTR Frontend + Dashboard)

- [ ] OTR profile creation UI
- [ ] Education / credentials entry UI
- [ ] Document upload UI
- [ ] Verification status display
- [ ] "Use OTR" flow on a government portal (consent review → prefill)
- [ ] Dashboard: applications list, status, application IDs
- [ ] Dashboard: consent history / access history views

**Now unblocked:** `frontend/` has a working Vite/React/TS scaffold that already proves it can reach the backend (see `frontend/src/App.tsx` — replace this placeholder, don't build around it). `GET/PATCH /api/otr/profile` are live and tested; register/login are live and tested. The dashboard's "consent history / access history" section (§20) can now be built against `GET /api/audit-logs` (live, tested, returns the current user's own history — see `docs/API_CONTRACTS.md`), though it will only show `LOGIN`/`PROFILE_UPDATED` events until Anchal's/Harsh's modules start emitting `CONSENT_*`/`DATA_ACCESSED`.

## Anchal (Consent + Document/Data Management + Application Flow)

- [ ] Consent request/grant/deny flow
- [ ] Consent audit trail (who/what/when)
- [ ] Document/credential metadata model
- [ ] Credential verification status simulation (mock issuer)
- [ ] Application-specific data handling (per-application fields, overrides)
- [ ] Application submission + application ID generation

**Now unblocked:** `consents`, `applications`, `application_data`, `access_requests` tables exist in the shared schema (`backend/src/db/schema.ts`) with the field shapes from Master Spec §11–13 — shape only, no business logic. `generateConsentReference()` and `generateApplicationRefId()` already exist in `backend/src/utils/idGenerator.ts`. The `credentials` table + `CredentialStatus` enum (`USER_PROVIDED → PENDING_VERIFICATION → VERIFIED` etc., per §6) exists but has no verification-simulation logic yet. The consent audit trail (§11: "traceable — user, application, requested fields, decision, timestamp, reference") can reuse `recordAuditEvent()` for the traceability part (`CONSENT_REQUESTED`/`GRANTED`/`DENIED`) — that's separate from the `consents` table row itself, which still needs your grant/deny business logic.

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
- [x] Audit-log tests (persistence, retrieval ordering, failed-login has no `userId`, cross-user isolation, `limit` validation) — 5 tests, passing against real Postgres
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
- [x] `docs/ARCHITECTURE_DECISIONS.md` (stack choice + Prisma→Drizzle deviation per §32; §7 added this session for the audit infrastructure)
- [x] `docs/API_CONTRACTS.md` (new — documents every endpoint that actually exists: health, auth, otr/profile, audit-logs. Update it when Harsh's/Anchal's real endpoints land; don't pre-document planned ones)
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
2. Harsh, Adi, Anchal: reported as already started on `feature/harsh-connectors`, `feature/adi-frontend`, `feature/anchal-consent-data` respectively — keep building against the live API contracts and shared schema in `docs/API_CONTRACTS.md`.
3. **Priyanshu: commit and push this session's audit-infrastructure changes** (see note below — they exist locally only right now) to `feature/priyanshu-foundation`, then decide whether/when to merge that branch into the three module branches or `main`.
4. Team: agree on `/api/consent` and `/api/applications` contracts (Anchal) and the mock-portal/mapping contract (Harsh) before those modules go deep, per Master Spec §23.
5. Build toward the smallest possible end-to-end path next: Government Portal → Consent → Data Retrieval → Form Prefill → Application Submission → Dashboard (Authentication → OTR Profile already works).

---

## Session Note — 2026-09-03 (audit infrastructure)

This session worked from `OTR-India-current.zip` (a source snapshot with no `.git` history) in a sandbox with **no GitHub write access and no reliable GitHub read access** this session (unauthenticated clone/raw-file/API access all failed — see chat for details). Concretely:

- All code/doc changes described above were implemented, built, and tested against a real, locally-provisioned PostgreSQL 16 instance in this session's sandbox — not against the actual shared dev/test databases the team uses.
- Nothing was committed or pushed anywhere. The working copy exists only in this session.
- **Action needed from Priyanshu:** pull these changes into the real local clone of `feature/priyanshu-foundation`, review, run `git status`/`git diff`, then commit (e.g. `feat: add audit-log persistence and GET /api/audit-logs`) and push for real.
- New/changed files: `backend/src/modules/audit/{auditEvents,audit.service,audit.controller,audit.routes,audit.validation}.ts`, `backend/src/app.ts` (mount route), `backend/src/modules/auth/auth.service.ts` and `backend/src/modules/otr-profile/otrProfile.service.ts` (persist instead of console-only), `backend/tests/audit.test.ts` (new), `docs/API_CONTRACTS.md` (new), `docs/ARCHITECTURE_DECISIONS.md` (§7 added), this file.

---
*Update this file whenever you complete a meaningful, verified feature, or when your work creates a dependency/blocker for another developer. Keep it factual.*
