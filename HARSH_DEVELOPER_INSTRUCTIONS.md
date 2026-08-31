# HARSH_DEVELOPER_INSTRUCTIONS.md

Repository version — Government Interoperability + Portal/API Connectors responsibilities for OTR-India.

> Read this alongside `MASTER_SPECIFICATION.md` (what we're building), `TEAM_WORKFLOW.md` (how the team works), and `PROJECT_STATUS.md` (what's actually done right now). Those three documents outrank this one if anything here seems to conflict — flag the conflict and default to them.

---

## 1. Developer Identity and Role

Harsh is the **Government Interoperability + Portal/API Connectors** developer on OTR-India, a 4-person SIH team (Priyanshu, Harsh, Adi, Anchal) building one project through one shared GitHub repository (`priyanshukumar79834-netizen/OTR-India`).

Harsh's work is the technical centerpiece of the project's connection to **PS 26129** (system integration and interoperability among government digital platforms). The rest of the team builds the citizen-facing OTR experience; Harsh builds the layer that proves different government systems can interoperate through OTR without being rebuilt.

## 2. Primary Ownership

- The **interoperability layer**: API gateway concept, canonical-model ↔ portal field mapping, connector/adapter structure, validation, and integration-side audit logging (per `MASTER_SPECIFICATION.md` §7, §10–11).
- **Mock government portals** (`GovRecruit-A`, `GovRecruit-B` or equivalent) with intentionally different field-naming conventions, per §8–9.
- Application-submission-facing interfaces: how a portal requests OTR data, how OTR responds, how a submitted application gets an application reference ID recorded on the interoperability side.

This is a **primary ownership area, not an isolated territory** — Harsh may touch shared files or other developers' areas when integration, bug-fixing, testing, or dependency resolution genuinely requires it, but should avoid unnecessarily modifying Priyanshu's, Adi's, or Anchal's modules without coordination.

## 3. Responsibilities

- Design and build the interoperability/connector architecture described in the Master Specification: `OTR → Interoperability Layer → Portal A / Portal B / Portal C ...` (§35).
- Build at least two mock government portals with genuinely different field names (e.g. Portal A `dob`, Portal B `birth_date`, OTR canonical `dateOfBirth`) to demonstrate the core interoperability story (§10, §21).
- Implement the data-mapping layer that translates the canonical OTR model to/from each portal's format, in both directions.
- Implement or coordinate the connector pattern so that adding a third portal later is "add a connector/config," not "rewrite the system" (§35).
- Handle integration-level error handling and data-quality/validation concerns for anything crossing the interoperability boundary (invalid/missing field, portal unavailable, malformed response, etc. — §24).
- Keep integration events auditable (e.g. `DATA_ACCESSED`, `APPLICATION_SUBMITTED` where relevant to the connector layer) without logging sensitive content (§24).

## 4. Features/Modules Harsh Is Expected to Build

- Interoperability layer (API gateway boundary, mapping/transformation logic, connector structure).
- Mock Government Portal A and Mock Government Portal B (or however many the team agrees to demo), each simulating a distinct external system with its own field names and, ideally, a distinct request/response shape.
- The connector/adapter code that lets each mock portal talk to OTR's canonical model.
- Field-mapping configuration or code (canonical ↔ Portal A, canonical ↔ Portal B) that is easy to extend for a future Portal C.
- Basic validation on data entering/leaving the interoperability layer (missing required field, invalid field, malformed payload).
- Tests for the interoperability layer itself: field mapping correctness, invalid/missing field handling (per `MASTER_SPECIFICATION.md` §34).

## 5. Features/Modules Harsh Should Understand but Not Primarily Own

- The OTR canonical data model and profile/credential schema — owned by Priyanshu (foundation) but Harsh must understand it deeply, since every mapping Harsh writes depends on it.
- Consent logic — owned by Anchal. Harsh's connectors must **respect** consent decisions (only request/receive fields that were actually granted) but shouldn't reimplement consent logic independently.
- The citizen-facing "Use OTR" UI flow — owned by Adi. Harsh needs to know what that flow expects to call and receive, but doesn't build the UI.
- Core authentication — owned by Priyanshu. Harsh's portals need to work with whatever auth mechanism the foundation provides, not invent a separate one.

## 6. Expected Interaction With the Other Three Developers

- **Priyanshu (backend/core architecture, API contracts):** Harsh consumes the canonical data model and core APIs Priyanshu establishes. If Harsh needs a new core API or a schema addition to support a mapping, that's a shared-code conversation with Priyanshu, not a silent change.
- **Adi (citizen-facing integration points):** the "Use OTR" flow on a mock portal is a shared surface — Adi builds the citizen-facing screen, Harsh builds what happens when that screen calls out to a mock portal / interoperability layer. Agree on the request/response shape together.
- **Anchal (consent/data-sharing requirements):** Harsh's connectors must only receive fields the citizen actually consented to. Anchal owns consent state and enforcement; Harsh's interoperability layer should call into or check against that consent decision rather than re-deciding what's shareable.

## 7. Dependencies on Other Modules

- Depends on Priyanshu's foundation for: the canonical data model shape, base API structure, database connection, and initial auth structure.
- Depends on Anchal for: consent state (what's been granted for a given application/request) before returning any data to a mock portal.
- Depends on Adi for: what the "Use OTR" trigger from the citizen-facing side actually sends (which portal, which application context).
- If any of these aren't ready yet, **mock the missing dependency clearly and record the blocker in `PROJECT_STATUS.md`** rather than guessing at an implementation and building against it as if it were final.

## 8. Expected Inputs/Outputs/Interfaces

- **Input to the interoperability layer:** a request from a mock portal (or the citizen-facing "Use OTR" flow) specifying which application/portal and which fields are needed.
- **Output from the interoperability layer:** the canonical OTR data, mapped into that portal's field-naming convention, containing **only** the fields that were requested and consented to (data minimization — `MASTER_SPECIFICATION.md` §11).
- **Interfaces to define and document** (with Priyanshu, before deep parallel work): the shape of a "field mapping request," a "mapped response," and how a submitted application gets an application reference ID recorded (`APP-<PORTAL>-<YEAR>-XXXX` style, per §18).
- Document these interfaces in the repository (e.g. an API contract doc or inline comments/README in the interoperability module) so Adi and Anchal can build against them without guessing.

## 9. Backend/Database Responsibilities

- Harsh's connectors and mapping logic are primarily backend-side. Any persistence needed specifically for the interoperability layer (e.g. a mapping-configuration table, or a log of which portal received which mapped payload) should be proposed to Priyanshu as a schema addition, not created as a separate, disconnected data store.
- Do not create a second database or a competing data model for the mock portals — mock portals can hold their own minimal, clearly-scoped storage (even in-memory or a simple table) to simulate being external systems, but the **canonical model stays owned by the shared schema**.

## 10. API/Integration Responsibilities

- Define clear API contracts for: what a mock portal exposes, what the interoperability layer exposes to the citizen-facing app, and what the interoperability layer expects from the canonical OTR backend. Use the format from `MASTER_SPECIFICATION.md` §23: endpoint, method, request/response format, auth/authz requirement, error format, expected status codes.
- Don't invent an API shape in isolation and expect Adi/Anchal to adapt to it after the fact — propose it, get quick agreement, then build.
- Gracefully handle: invalid token/reference, missing required field, unauthorized data request, consent denied, portal unavailable, invalid application data (`MASTER_SPECIFICATION.md` §24). Never expose raw internal errors to a portal or citizen-facing caller.

## 11. Security and Privacy Responsibilities

- Never return more fields than a given request/consent authorizes — this is a direct extension of Anchal's consent decisions into the interoperability layer, and it's one of the project's non-negotiable rules (§11, §17).
- Never store or log real citizen data — only synthetic/demo data (`Priyanshu Demo`, `9000000000`, etc.), per §17 and §27 of the Master Spec.
- Treat any token/reference used between a portal and OTR as a secure reference for a specific transaction — never as proof that an application was submitted in full (§19). The actual application submission record is a separate, durable record.
- Don't log sensitive document contents or secrets in audit events — log the event type, reference, requesting system, timestamp, and result only (§41).

## 12. Testing Responsibilities

At minimum (per `MASTER_SPECIFICATION.md` §34):
- **Interoperability tests:** correct field mapping in both directions (canonical ↔ Portal A, canonical ↔ Portal B), invalid field handling, missing field handling.
- **Integration tests:** a mock portal successfully requesting and receiving only the fields it's authorized for; a portal request with no/expired consent being correctly denied.
- Contribute to the full end-to-end integration test (`Citizen → OTR → Portal A → Consent → Data retrieval → Form prefill → Submit → Application ID → Dashboard`, repeated with Portal B) — this must work before the September 4 feature freeze.

## 13. Verification Requirements

Before calling a feature done: **Code** (builds, correct types/imports, no obvious bugs) → **Runtime** (the mock portal + mapping actually runs and returns correct mapped data) → **Integration** (doesn't break Adi's or Anchal's flows, works against the actual current backend, not an assumed one) → **Security** (no more fields returned than authorized, no secrets/real data) → **Git** (know exactly what changed and why). Claude reporting "implementation complete" is not verification — actually run it.

## 14. Git/GitHub Workflow

- Work primarily on a feature branch, e.g. `feature/harsh-interoperability` (exact name confirmed with Priyanshu as branch strategy finalizes).
- `main` stays stable — no direct experimentation on `main`.
- Meaningful commits (`feat: add GovRecruit-A connector`, `feat: implement canonical-to-portal field mapping`), never `update`/`final`/`changes`.
- `git status` and `git diff` before every commit — know exactly what changed.
- Before integrating/merging: pull latest `main`, resolve conflicts carefully, run tests, verify integration, then commit/push and open/update the PR.
- Never force-push, never run a destructive git operation (`reset`, `rebase`, a `checkout`/`restore` that discards work, branch deletion) without first explaining the consequence — three other people may have uncommitted or recent work.
- Never overwrite another developer's work simply to resolve a merge conflict — understand what changed on both sides first.

## 15. Claude Code Workflow

- **Inspect before implementing.** Read `MASTER_SPECIFICATION.md`, `TEAM_WORKFLOW.md`, and `PROJECT_STATUS.md` before starting significant work. Check recent commits and existing interoperability-related code — don't assume the repository is in the state it was in a previous conversation.
- **Treat the current repository as the source of truth for implementation state.** If a previous Claude conversation said "the mapping layer works this way" but the repo shows otherwise, the repo wins.
- **Don't assume another developer's module is absent** just because it's not described in the original specification — check the actual repo before building a substitute.
- **Reuse existing components and interfaces** where appropriate; don't rewrite working code just because a different approach looks cleaner.
- **Don't repeatedly pull `main` before every small edit** — that interrupts flow. Synchronize at the start of significant work and before integration.
- **Propose a plan before implementing.** Claude should think independently and is encouraged to improve implementation details, architecture, code quality, testing, and reliability where consistent with the spec — but must clearly separate: what the specification requires, what's an engineering decision Claude made, what's an assumption, and what's an optional improvement Harsh can accept or defer.
- Use engineering judgment wherever the specification leaves implementation details open (e.g. exact mapping-config format, exact connector interface) — but don't silently redesign shared architecture; flag anything that looks like a major architectural change per `MASTER_SPECIFICATION.md` §32.

## 16. `PROJECT_STATUS.md` Workflow

- Read it before starting significant work to see what Priyanshu, Adi, and Anchal have actually completed or are mid-way through.
- Update the **Harsh** section after finishing a meaningful, **verified** feature — never check a box because code was written; check it because it runs and was tested.
- Record in-progress work honestly (don't leave stale unchecked boxes with no context if something is half-done and blocked).
- Record blockers and dependencies explicitly — e.g. "interoperability layer needs the canonical schema finalized by Priyanshu before field mapping can be locked in," or "Portal B connector blocked on Anchal's consent-check API."
- Update priorities if circumstances change (e.g. if the team decides to demo only one portal instead of two).

## 17. Rules for Inspecting the Current Repository Before Working

Before significant work: check `git status`, current branch, recent relevant commits (especially anything touching the canonical model, shared API structure, or consent), and whether Priyanshu/Adi/Anchal have modified related files. Read `PROJECT_STATUS.md` first.

## 18. Rules for Synchronization With the Latest Repository State

Sync with `main` before starting a significant new task and before merging/integrating. During active, in-progress work on a task already underway, don't repeatedly pull — that risks clobbering uncommitted work and interrupts flow. Stay aware of relevant changes elsewhere (especially to the canonical model) and inspect them when they become relevant.

## 19. Rules for Avoiding Conflicts

- Stay within the interoperability/connector module for day-to-day work; touch shared files (schema, shared types, auth) only when genuinely necessary, and communicate first.
- Before modifying anything that looks shared, ask: could Priyanshu, Adi, or Anchal be depending on this right now?
- If a merge conflict arises, understand both sides of the change before resolving — never blindly take "mine" or "theirs."

## 20. Rules for Shared Files

Database schema, API contracts, authentication, shared types, environment configuration, and common components are shared. If Harsh needs to change one of these to support the interoperability layer:
1. Explain why it's needed.
2. Check whether Priyanshu/Adi/Anchal's module depends on it.
3. Tell the team (flag it in `PROJECT_STATUS.md`).
4. Make the change carefully.
5. Test affected functionality across modules, not just Harsh's own.

## 21. Rules for Documenting Important Architectural Decisions

If Harsh (or Claude) identifies a decision worth recording — e.g. "we chose to represent the canonical-to-portal mapping as a config file rather than inline code because it's easier for a third portal later" — document it in the relevant `.md` file (or a new `docs/` note) so another team member can understand the system without re-reading the whole Claude conversation. Any change that qualifies as a **major architectural change** (new framework, new major dependency, restructuring the connector pattern significantly) must go through the process in `MASTER_SPECIFICATION.md` §32: stop, explain, check impact, get team-lead approval, update the spec, then implement.

## 22. Rules for Reporting Blockers/Dependencies

Record blockers and cross-module dependencies in `PROJECT_STATUS.md` as soon as they're identified — don't wait until integration day to surface that, e.g., Portal B's connector can't be finished until Anchal's consent-check endpoint exists. Communicate anything urgent to Priyanshu directly as well, since `PROJECT_STATUS.md` updates alone may not be seen in real time.

## 23. Definition of "Done" (for Harsh's Work)

A feature is done when: it's implemented, it builds/runs, it's been tested against the actual current backend and consent logic (not a guess), it correctly enforces data minimization, it doesn't break Adi's or Anchal's existing flows, the relevant `PROJECT_STATUS.md` box is checked with confidence, and any new interface it exposes is documented for the rest of the team.

## 24. Development Workflow

```
PLAN → INSPECT → IMPLEMENT → TEST → VERIFY → UPDATE STATUS → COMMIT → PUSH
```

- **Plan:** briefly explain understanding of the task and propose an approach before writing code.
- **Inspect:** check current repo state, `PROJECT_STATUS.md`, and relevant existing code.
- **Implement:** build the smallest correct version first (e.g. get one portal's mapping fully correct before adding a second).
- **Test:** run interoperability/integration tests described in §12.
- **Verify:** walk through the checklist in §13.
- **Update status:** reflect real, verified progress in `PROJECT_STATUS.md`.
- **Commit:** meaningful commit message, `git status`/`git diff` reviewed first.
- **Push:** to the feature branch; open/update a PR when ready for integration.

## 25. Engineering Judgment

The Master Specification intentionally leaves some implementation details open (exact mapping-config format, exact connector interface shape, exact mock-portal request/response structure). Use good engineering judgment to fill these gaps in a way that's simple, testable, and easy for a third portal to extend later — and clearly label these as engineering decisions, not spec requirements, when reporting back.

## 26. No Unsupported Government Integrations

Do **not** claim or build against real SSC/UPSC/RRB/government APIs unless such access genuinely exists and is legally/technically appropriate (`MASTER_SPECIFICATION.md` §8). Everything Harsh builds for the SIH prototype is a **mock** government portal that simulates a distinct external system — this must be clear in code, comments, and any demo narration. Never present mock data or mock verification as if it came from a real government source.

## 27. Preserve the Core OTR-India Concept

OTR-India is not "one giant database" and not "just an autofill tool" (`MASTER_SPECIFICATION.md` §4, §62). Harsh's interoperability layer is the concrete proof of the project's actual thesis: **existing/mock government systems can interoperate through a standardized, consent-based, data-minimizing layer without being replaced.** Every design decision in this module should reinforce that story, not quietly turn into "just import the portal's schema directly" or "just give the portal the whole profile."

---
*OTR-India | SIH Internal Hackathon | Harsh Developer Instructions v1.0*
*Consolidated from MASTER_SPECIFICATION.md, TEAM_WORKFLOW.md, and the team's stated role assignment for Government Interoperability + Portal/API Connectors.*
