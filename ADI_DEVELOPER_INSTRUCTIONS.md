# ADI_DEVELOPER_INSTRUCTIONS.md

Repository version — Citizen-facing Application + OTR UI + Dashboard responsibilities for OTR-India.

> Read this alongside `MASTER_SPECIFICATION.md` (what we're building), `TEAM_WORKFLOW.md` (how the team works), and `PROJECT_STATUS.md` (what's actually done right now). Those three documents outrank this one if anything here seems to conflict — flag the conflict and default to them.

---

## 1. Developer Identity and Role

Adi is the **Citizen-facing Application + OTR UI + Dashboard** developer on OTR-India, a 4-person SIH team (Priyanshu, Harsh, Adi, Anchal) building one project through one shared GitHub repository (`priyanshukumar79834-netizen/OTR-India`).

Adi builds the surface the judges will actually click through: the citizen's experience of registering once, seeing their reusable profile, using it on a government portal, and tracking what happened. Adi's UI is where the project's core value proposition — "enter once, reuse with consent" — becomes visible and demonstrable.

## 2. Primary Ownership

- Citizen registration and OTR-profile-creation UI.
- OTR profile / dashboard: personal profile, education, credentials, documents, verification status views (`MASTER_SPECIFICATION.md` §20).
- The citizen-facing side of the "Use OTR" flow: opening a government portal, triggering "Use OTR," reviewing requested fields, and seeing the form populate.
- Application tracking UI: applications list, status, application IDs, consent history, access/audit history views (§20, §32 primary demo workflow).

This is a **primary ownership area, not an isolated territory** — Adi may touch shared files or other developers' areas when integration, bug-fixing, testing, or dependency resolution genuinely requires it, but should avoid unnecessarily modifying Priyanshu's, Harsh's, or Anchal's modules without coordination.

## 3. Responsibilities

- Build the primary demo workflow's citizen-facing steps end to end (`MASTER_SPECIFICATION.md` §21): create account → complete profile → add education/credentials/documents → see verification status → open Portal A → "Use OTR" → authenticate → review requested fields → consent → see form populate → add application-specific fields → submit → see application ID → see it on the dashboard → repeat with Portal B.
- Keep a clear visual/UX separation between **reusable OTR information** and **application-specific information**, so it's obvious to a user (and a judge) which is which (§12, §33).
- Make consent, verification status, and application status **clearly visible** — not buried or ambiguous (§26 frontend principles).
- Keep the frontend simple, accessible, mobile-responsive, and understandable within seconds; avoid unnecessary animation or complexity (§26).

## 4. Features/Modules Adi Is Expected to Build

- OTR profile creation UI (identity, contact, address, education fields).
- Education/credentials entry UI, with verification status clearly shown per credential (e.g. `Verified`, `Pending Verification`, `User Provided` — reflecting the real backend status, not a UI-invented one; §6, §23).
- Document upload UI (can be simplified for the prototype, but must reflect real metadata from the backend, not fabricated state).
- The "Use OTR" trigger on a mock government portal screen, the consent-review screen (showing exactly which fields are requested, per §14's example), and the resulting prefilled application form.
- Dashboard: applications list (application name, government organisation, date, status, application ID — §20), consent history, and access/audit history views.
- Basic UI-level tests: does the UI render correctly, do interactions work, do API calls succeed/fail gracefully, do loading and error states behave sensibly.

## 5. Features/Modules Adi Should Understand but Not Primarily Own

- The interoperability/mapping layer and mock portals themselves — owned by Harsh. Adi needs to know what data shape a portal expects to trigger and receive, but doesn't build the connector logic.
- Consent decision logic and data-minimization enforcement — owned by Anchal. Adi's UI **displays** the consent request and **calls** the consent-grant/deny action, but the actual authorization logic lives with Anchal.
- Core authentication and the canonical data model — owned by Priyanshu. Adi consumes whatever auth mechanism and profile schema the foundation provides.

## 6. Expected Interaction With the Other Three Developers

- **Priyanshu (backend APIs, authentication/data contracts):** Adi's UI must be built against the actual backend API contracts Priyanshu establishes (e.g. `GET /api/otr/profile`), not invented ones. If a screen needs a field or endpoint that doesn't exist yet, that's a conversation with Priyanshu, not a made-up mock that later has to be rewired.
- **Anchal (consent/document/data-management flows):** the consent-review screen is a shared surface — Anchal owns what fields get requested and what "grant"/"deny" actually does; Adi owns how it's presented and interacted with. Agree on the request/response shape together.
- **Harsh (application submission/integration interfaces):** the "Use OTR" trigger and the prefilled-form population depend on what Harsh's interoperability layer returns. Confirm the shape of that response before building the prefill UI around assumptions.

## 7. Dependencies on Other Modules

- Depends on Priyanshu's foundation for: auth mechanism, base API structure, and the canonical profile/credential schema (field names, types).
- Depends on Anchal for: the consent request/response shape and consent-history data.
- Depends on Harsh for: what a "Use OTR" call against a mock portal actually returns, and how an application ID gets generated/returned after submission.
- If any of these aren't ready yet, **build against a clearly-labeled placeholder and record the blocker in `PROJECT_STATUS.md`**, rather than silently inventing a permanent API shape that others then have to conform to.

## 8. Expected Inputs/Outputs/Interfaces

- **Input to the UI:** authenticated citizen session, OTR profile/credential data from the backend, consent-request payloads from Anchal's module, mapped/prefilled application data from Harsh's module.
- **Output from the UI:** profile create/update requests, consent grant/deny actions, application-specific field submissions, "Use OTR" trigger events.
- Document any UI-driven interface expectations (e.g. "the dashboard expects `applications[]` with `{name, organisation, date, status, applicationId}`") so Priyanshu/Anchal/Harsh can build against the same shape.

## 9. Frontend/Backend Responsibilities

- Adi's work is primarily **frontend**. Don't tightly couple UI components directly to database implementation — go through the backend API layer (`MASTER_SPECIFICATION.md` §38).
- If a screen needs data the current API doesn't provide, propose the addition to Priyanshu rather than querying the database directly or fabricating data client-side.
- Keep state management simple and consistent with whatever pattern the foundation establishes — don't introduce a competing state-management approach independently.

## 10. API/Integration Responsibilities

- Consume the agreed API contracts (endpoint, method, request/response format, auth requirement, error format, expected status codes — §23) rather than assuming a shape.
- Handle API error states gracefully in the UI: invalid auth, expired session, consent denied, credential unavailable, verification pending, portal unavailable (§24) — show clear, non-alarming messages, never raw backend errors.
- The frontend must reflect the actual backend contracts and **must not invent APIs** the backend doesn't have.

## 11. Security and Privacy Responsibilities

- Never display more information than the current context/consent allows — e.g. don't render a full profile dump on a portal-facing screen when only specific fields were requested.
- Never put sensitive information in URLs, frontend logs, or console logs.
- Use only synthetic/demo data for development and the demo (`Priyanshu Demo`, `demo@example.com`, `9000000000`, etc. — §17, §27).
- Keep session/token handling on the frontend consistent with whatever secure pattern Priyanshu's auth foundation defines; don't invent a separate token-storage approach.

## 12. Testing Responsibilities

For frontend features, verify (per `PRIYANSHU_DEVELOPER_INSTRUCTIONS.md` §10 pattern, applied to Adi's scope):
- UI renders correctly for each screen (profile, credentials, dashboard, consent review, prefilled form).
- Interactions work (form submission, consent grant/deny, "Use OTR" trigger).
- API calls work against the real backend, not a stub that later diverges.
- Loading states and error states behave sensibly (don't leave a screen stuck or silently fail).
- Contribute to the full end-to-end integration test (`Citizen → OTR → Portal A → Consent → Data retrieval → Form prefill → Submit → Application ID → Dashboard`, repeated with Portal B) — this must work before the September 4 feature freeze.

## 13. Verification Requirements

Before calling a feature done: **Code** (builds, correct imports/types, no obvious bugs) → **Runtime** (the app starts, the screen actually renders and works) → **Integration** (works against the actual current backend/consent/interoperability APIs, not assumed ones) → **Security** (no exposed sensitive data, no secrets in logs) → **Git** (know exactly what changed and why). Claude reporting "implementation complete" is not verification — actually click through it.

## 14. Git/GitHub Workflow

- Work primarily on a feature branch, e.g. `feature/adi-frontend` (exact name confirmed with Priyanshu as branch strategy finalizes).
- `main` stays stable — no direct experimentation on `main`.
- Meaningful commits (`feat: add OTR profile dashboard`, `feat: implement consent review screen`), never `update`/`final`/`changes`.
- `git status` and `git diff` before every commit.
- Before integrating/merging: pull latest `main`, resolve conflicts carefully, run tests, verify integration, then commit/push and open/update the PR.
- Never force-push, never run a destructive git operation without first explaining the consequence — three other people may have uncommitted or recent work.
- Never overwrite another developer's work simply to resolve a merge conflict.

## 15. Claude Code Workflow

- **Inspect before implementing.** Read `MASTER_SPECIFICATION.md`, `TEAM_WORKFLOW.md`, and `PROJECT_STATUS.md` before starting significant work. Check recent commits and existing frontend/UI code — don't assume the repo is in the state it was in a previous conversation.
- **Treat the current repository as the source of truth for implementation state.** If a prior Claude conversation described a screen differently than the current repo, the repo wins.
- **Don't assume another developer's module is absent** just because it's not described in the original specification — check the actual repo before building a substitute or a duplicate.
- **Reuse existing components** where appropriate; don't rewrite a working screen just because a different approach looks cleaner.
- **Don't repeatedly pull `main` before every small edit** — synchronize at the start of significant work and before integration instead.
- **Propose a plan before implementing.** Claude should think independently and may improve UX, accessibility, code quality, and reliability where consistent with the spec — but must clearly separate: what the specification requires, what's an engineering/design decision Claude made, what's an assumption, and what's an optional improvement Adi can accept or defer.
- Use engineering judgment where the spec leaves details open (exact layout, exact component structure) — but don't silently redesign shared architecture (auth flow, state management pattern, styling system) without flagging it per `MASTER_SPECIFICATION.md` §32.

## 16. `PROJECT_STATUS.md` Workflow

- Read it before starting significant work to see what Priyanshu, Harsh, and Anchal have actually completed or are mid-way through.
- Update the **Adi** section after finishing a meaningful, **verified** feature — never check a box because a component was written; check it because it renders, works, and was tested against real data.
- Record in-progress work honestly.
- Record blockers and dependencies explicitly — e.g. "dashboard blocked on Anchal's consent-history API," or "prefill screen blocked on Harsh's mapped-response shape."
- Update priorities if circumstances change.

## 17. Rules for Inspecting the Current Repository Before Working

Before significant work: check `git status`, current branch, recent relevant commits (especially anything touching the API contracts, auth, or shared components), and whether Priyanshu/Harsh/Anchal have modified related files. Read `PROJECT_STATUS.md` first.

## 18. Rules for Synchronization With the Latest Repository State

Sync with `main` before starting a significant new task and before merging/integrating. During active, in-progress work, don't repeatedly pull. Stay aware of relevant changes elsewhere (especially to API contracts) and inspect them when they become relevant.

## 19. Rules for Avoiding Conflicts

- Stay within the frontend/UI module for day-to-day work; touch shared files (schema, shared types, auth) only when genuinely necessary, and communicate first.
- Before modifying anything shared, ask: could Priyanshu, Harsh, or Anchal be depending on this right now?
- If a merge conflict arises, understand both sides before resolving — never blindly take "mine" or "theirs."

## 20. Rules for Shared Files

Database schema, API contracts, authentication, shared types, environment configuration, and common components are shared. If Adi needs to change one to support a screen:
1. Explain why it's needed.
2. Check whether Priyanshu/Harsh/Anchal's module depends on it.
3. Tell the team (flag it in `PROJECT_STATUS.md`).
4. Make the change carefully.
5. Test affected functionality across modules.

## 21. Rules for Documenting Important Architectural Decisions

Document meaningful frontend decisions (e.g. state-management approach, component library conventions, routing structure) in the repository so another team member can understand the system without re-reading the whole Claude conversation. Any change that qualifies as a **major architectural change** (new framework, replacing the whole frontend, a fundamentally different data-flow pattern) must go through the process in `MASTER_SPECIFICATION.md` §32: stop, explain, check impact, get team-lead approval, update the spec, then implement.

## 22. Rules for Reporting Blockers/Dependencies

Record blockers and cross-module dependencies in `PROJECT_STATUS.md` as soon as they're identified — don't wait until integration day. Communicate anything urgent to Priyanshu directly as well.

## 23. Definition of "Done" (for Adi's Work)

A feature is done when: it's implemented, it builds/runs, it's been tested against the actual current backend/consent/interoperability APIs (not a guess), it clearly separates reusable OTR data from application-specific data in the UI, it handles loading/error states gracefully, it doesn't break existing flows, the relevant `PROJECT_STATUS.md` box is checked with confidence, and any new UI-driven interface expectation is documented for the rest of the team.

## 24. Development Workflow

```
PLAN → INSPECT → IMPLEMENT → TEST → VERIFY → UPDATE STATUS → COMMIT → PUSH
```

- **Plan:** briefly explain understanding of the task and propose an approach before writing code.
- **Inspect:** check current repo state, `PROJECT_STATUS.md`, and relevant existing screens/components.
- **Implement:** build the smallest correct version first (e.g. get the core profile screen working before polishing the dashboard).
- **Test:** run through §12.
- **Verify:** walk through the checklist in §13.
- **Update status:** reflect real, verified progress in `PROJECT_STATUS.md`.
- **Commit:** meaningful commit message, `git status`/`git diff` reviewed first.
- **Push:** to the feature branch; open/update a PR when ready for integration.

## 25. Engineering Judgment

The Master Specification intentionally leaves UI/UX implementation details open (exact layout, exact component breakdown, exact styling). Use good engineering judgment to fill these gaps in a way that's simple, accessible, and understandable within seconds — and clearly label these as engineering/design decisions, not spec requirements, when reporting back.

## 26. No Unsupported Government Integrations / Production Capabilities

Do **not** design or present the UI as if it connects to real government systems, real Aadhaar/biometric authentication, or real automatic verification, unless such capability genuinely exists (`MASTER_SPECIFICATION.md` §8, §15, §23, §59 claims table). All portals in the demo are mock portals; verification statuses shown must reflect actual (mocked) backend state, not UI-invented statuses.

## 27. Preserve the Core OTR-India Concept

OTR-India is not "just an autofill extension" and not "just a document storage system" (`MASTER_SPECIFICATION.md` §62). Adi's UI is the primary place where the project's actual thesis — reusable citizen data + consent + verification + interoperability, demonstrated across two differently-structured portals — becomes visible to a judge. Every screen should reinforce that story: what's reusable, what's application-specific, what was consented to, and what's verified vs. self-provided.

---
*OTR-India | SIH Internal Hackathon | Adi Developer Instructions v1.0*
*Consolidated from MASTER_SPECIFICATION.md, TEAM_WORKFLOW.md, and the team's stated role assignment for Citizen-facing Application + OTR UI + Dashboard.*
