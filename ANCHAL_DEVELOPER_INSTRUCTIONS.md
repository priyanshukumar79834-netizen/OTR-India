# ANCHAL_DEVELOPER_INSTRUCTIONS.md

Repository version — Consent + Document/Data Management + Application Flow responsibilities for OTR-India.

> Read this alongside `MASTER_SPECIFICATION.md` (what we're building), `TEAM_WORKFLOW.md` (how the team works), and `PROJECT_STATUS.md` (what's actually done right now). Those three documents outrank this one if anything here seems to conflict — flag the conflict and default to them.

---

## 1. Developer Identity and Role

Anchal is the **Consent + Document/Data Management + Application Flow** developer on OTR-India, a 4-person SIH team (Priyanshu, Harsh, Adi, Anchal) building one project through one shared GitHub repository (`priyanshukumar79834-netizen/OTR-India`).

Anchal owns the parts of the system that make OTR-India **trustworthy rather than just convenient**: the citizen decides what gets shared, credentials are honestly labeled as verified-or-not, and every data-sharing event is traceable. This is the module most directly tied to the project's privacy/security credibility with judges.

## 2. Primary Ownership

- **Consent management**: consent requests, consent states (grant/deny/expired/invalid), and the audit trail of consent events (`MASTER_SPECIFICATION.md` §11, §15, §41).
- **Document/credential metadata and verification-status modeling**: `USER_PROVIDED → PENDING_VERIFICATION → VERIFIED` (also `REJECTED`, `EXPIRED`, `REVOKED`), with a mocked issuer for the prototype (§6, §23).
- **Data minimization enforcement**: ensuring no more fields are shared than a given, granted consent authorizes (§11).
- **Application-specific data handling**: per-application fields and application-level overrides that don't mutate the master OTR profile (§12–13), plus application submission recording and application-ID generation logic (§18).

This is a **primary ownership area, not an isolated territory** — Anchal may touch shared files or other developers' areas when integration, bug-fixing, testing, or dependency resolution genuinely requires it, but should avoid unnecessarily modifying Priyanshu's, Harsh's, or Adi's modules without coordination.

## 3. Responsibilities

- Implement the consent flow: given a request specifying which fields an application wants, present that request (in coordination with Adi's UI) and record grant/deny with a timestamp and a consent reference (`CONSENT-XXXX` style — §15).
- Enforce data minimization at the point of authorization: only fields actually requested *and* granted should ever be marked shareable.
- Maintain credential/document metadata: `id`, `type`, `issuer`, `verificationStatus`, `issueDate`, `expiry`, `reference` (§5, §23) — and never let the system silently treat "uploaded" as "verified."
- Implement application-specific data handling: fields scoped to one application only, and per-application overrides (e.g. a different email for one application) that leave the master OTR profile untouched (§13, §36).
- Implement application submission recording and application reference ID generation (`APP-<PORTAL>-<YEAR>-XXXX` style — §18), independent of any token used for data retrieval — a token is not proof of submission.
- Keep consent/access events auditable without logging sensitive content (§41).

## 4. Features/Modules Anchal Is Expected to Build

- Consent request/grant/deny flow and its backing data model.
- Consent audit trail (who/what/when — user, application, requested fields, decision, timestamp, reference).
- Document/credential metadata model, distinct from the raw file storage itself (§14: metadata in the relational DB, actual files in object storage — coordinate the storage boundary with Priyanshu).
- Credential verification-status simulation via a mock issuer (e.g. "Mock Education Board" marking a 10th marksheet `VERIFIED`).
- Application-specific data handling: per-application field storage and override logic that doesn't touch the master profile.
- Application submission logic and application-ID generation.
- Tests for consent (grant/deny/expired-invalid) and application (create/validate/submit/generate ID) per `MASTER_SPECIFICATION.md` §34.

## 5. Features/Modules Anchal Should Understand but Not Primarily Own

- The canonical OTR profile schema and core backend/auth — owned by Priyanshu, but Anchal's consent and application-data models must fit cleanly into that schema, not compete with it.
- The interoperability/mapping layer and mock portals — owned by Harsh. Anchal's consent decisions are what Harsh's connectors must check against before returning any data; Anchal doesn't build the connectors themselves.
- The citizen-facing consent-review UI and dashboard views — owned by Adi. Anchal defines what data the consent request/response and history contain; Adi decides how it's displayed.

## 6. Expected Interaction With the Other Three Developers

- **Priyanshu (database/backend architecture):** consent, credential, and application-data tables are part of the shared schema. Propose additions/changes to Priyanshu rather than creating a parallel data store.
- **Adi (consent/document/application UI):** the consent-review screen and document/verification-status displays are shared surfaces — Anchal owns the underlying data and authorization logic, Adi owns the presentation and interaction. Agree on the request/response shape together.
- **Harsh (interoperability and data-sharing interfaces):** Harsh's connectors must check Anchal's consent state before returning any field to a portal. Define a clear "is this field authorized for this request" check/interface together rather than letting Harsh re-implement authorization logic independently.

## 7. Dependencies on Other Modules

- Depends on Priyanshu's foundation for: the canonical profile/credential schema, base API structure, database connection, and auth (to know *who* is granting consent).
- Depends on Adi for: how consent requests are triggered from the UI and how grant/deny actions get invoked.
- Depends on Harsh for: what fields a given portal is actually requesting, so the consent-request payload reflects a real request rather than a guess.
- If any of these aren't ready yet, **build against a clearly-labeled placeholder and record the blocker in `PROJECT_STATUS.md`**, rather than finalizing a consent/data model in isolation that others later have to conform to.

## 8. Expected Inputs/Outputs/Interfaces

- **Input:** a data request from Harsh's interoperability layer (which fields, for which portal/application), a grant/deny action from Adi's UI, a document/credential submitted by the citizen.
- **Output:** a consent decision + reference (for Adi's UI and Harsh's connectors to consume), an authorization check result ("is field X shareable for this request right now") for Harsh's connectors, verification-status updates for Adi's UI, and an application reference ID after submission.
- Document these interfaces (e.g. a "consent decision" shape, an "authorization check" endpoint, a "credential metadata" shape) so Adi and Harsh can build against them without guessing.

## 9. Backend/Database Responsibilities

- Anchal's work is primarily backend/data-model. Propose new tables/fields (`consents`, `credentials`, `documents`, `application_data`, `access_requests`, `audit_logs` per §28) to Priyanshu rather than creating a separate schema.
- Avoid unnecessary duplication — application-specific overrides reference the master profile, they don't copy it wholesale (§13).
- Don't store large binary documents directly in relational fields; keep metadata in the DB and actual files in object storage, matching the pattern in §14.

## 10. API/Integration Responsibilities

- Define clear API contracts for: requesting consent, granting/denying consent, checking authorization for a specific field/request, retrieving credential/verification status, and submitting an application (endpoint, method, request/response shape, auth requirement, error format, status codes — §23).
- Handle gracefully: consent denied, credential unavailable, verification pending, invalid/expired consent request, invalid application data (§24). Never expose raw internal errors.

## 11. Security and Privacy Responsibilities

- This module **is** the project's core privacy enforcement point — treat it accordingly. Never mark a credential verified just because it was uploaded (§6, §23).
- Enforce data minimization strictly: a request for Name/DOB/10th-Qualification must never be able to also pull Phone/Email/Caste-Certificate (§11).
- Keep the consent audit trail traceable but don't log sensitive document contents or secrets (§41).
- Never construct or expose identifiers (OTR ID, application ID) in a way that's derivable from Aadhaar, phone, DOB, or email (§17–18).
- Use only synthetic/demo data (`Priyanshu Demo`, `9000000000`, mock certificate references, etc. — §17, §27).
- Support the cyber-café/assisted-access case conceptually: an operator helping a citizen should not thereby gain unrestricted access to the citizen's whole OTR profile (§24 of the source SIH doc / §16 of the Master Spec cyber-café section).

## 12. Testing Responsibilities

At minimum (per `MASTER_SPECIFICATION.md` §34):
- **Consent tests:** grant, deny, expired/invalid request.
- **Application tests:** create, validate, submit, generate application ID.
- **Security tests:** unauthorized access, invalid token, access attempted without consent.
- Contribute to the full end-to-end integration test (`Citizen → OTR → Portal A → Consent → Data retrieval → Form prefill → Submit → Application ID → Dashboard`, repeated with Portal B) — this must work before the September 4 feature freeze.

## 13. Verification Requirements

Before calling a feature done: **Code** (builds, correct types/imports, no obvious bugs) → **Runtime** (consent flow and application submission actually run correctly) → **Integration** (Harsh's connectors correctly get denied when consent is missing/expired, Adi's UI correctly reflects real consent/verification state) → **Security** (no over-sharing, no exposed secrets/real data) → **Git** (know exactly what changed and why). Claude reporting "implementation complete" is not verification — actually run a grant/deny/expired scenario and confirm the behavior.

## 14. Git/GitHub Workflow

- Work primarily on a feature branch, e.g. `feature/anchal-consent` (exact name confirmed with Priyanshu as branch strategy finalizes).
- `main` stays stable — no direct experimentation on `main`.
- Meaningful commits (`feat: implement consent grant/deny flow`, `feat: add credential verification-status model`), never `update`/`final`/`changes`.
- `git status` and `git diff` before every commit.
- Before integrating/merging: pull latest `main`, resolve conflicts carefully, run tests, verify integration, then commit/push and open/update the PR.
- Never force-push, never run a destructive git operation without first explaining the consequence — three other people may have uncommitted or recent work.
- Never overwrite another developer's work simply to resolve a merge conflict.

## 15. Claude Code Workflow

- **Inspect before implementing.** Read `MASTER_SPECIFICATION.md`, `TEAM_WORKFLOW.md`, and `PROJECT_STATUS.md` before starting significant work. Check recent commits and existing consent/document/application code — don't assume the repo is in the state it was in a previous conversation.
- **Treat the current repository as the source of truth for implementation state.** If a prior Claude conversation described the consent model differently than the current repo, the repo wins.
- **Don't assume another developer's module is absent** just because it's not described in the original specification — check the actual repo before building a substitute.
- **Reuse existing components and interfaces** where appropriate; don't rewrite working consent/application logic just because a different approach looks cleaner.
- **Don't repeatedly pull `main` before every small edit** — synchronize at the start of significant work and before integration instead.
- **Propose a plan before implementing.** Claude should think independently and may improve the data model, security posture, testing, and reliability where consistent with the spec — but must clearly separate: what the specification requires, what's an engineering decision Claude made, what's an assumption, and what's an optional improvement Anchal can accept or defer.
- Use engineering judgment where the spec leaves details open (exact consent-reference format, exact verification-status transition rules) — but don't design a privacy model that contradicts the Master Specification, and flag anything resembling a major architectural change per §32.

## 16. `PROJECT_STATUS.md` Workflow

- Read it before starting significant work to see what Priyanshu, Harsh, and Adi have actually completed or are mid-way through.
- Update the **Anchal** section after finishing a meaningful, **verified** feature — never check a box because code was written; check it because grant/deny/expired scenarios were actually tested and the data-minimization rule actually holds.
- Record in-progress work honestly.
- Record blockers and dependencies explicitly — e.g. "authorization-check API blocked until Priyanshu finalizes the credentials table," or "consent-review payload shape needs sign-off from Adi and Harsh."
- Update priorities if circumstances change.

## 17. Rules for Inspecting the Current Repository Before Working

Before significant work: check `git status`, current branch, recent relevant commits (especially anything touching the schema, auth, or the interoperability request shape), and whether Priyanshu/Harsh/Adi have modified related files. Read `PROJECT_STATUS.md` first.

## 18. Rules for Synchronization With the Latest Repository State

Sync with `main` before starting a significant new task and before merging/integrating. During active, in-progress work, don't repeatedly pull. Stay aware of relevant changes elsewhere (especially to the schema and interoperability request shape) and inspect them when they become relevant.

## 19. Rules for Avoiding Conflicts

- Stay within the consent/document/application-data module for day-to-day work; touch shared files (schema, shared types, auth) only when genuinely necessary, and communicate first.
- Before modifying anything shared, ask: could Priyanshu, Harsh, or Adi be depending on this right now?
- If a merge conflict arises, understand both sides before resolving — never blindly take "mine" or "theirs."

## 20. Rules for Shared Files

Database schema, API contracts, authentication, shared types, environment configuration, and common components are shared. If Anchal needs to change one to support consent/application-data work:
1. Explain why it's needed.
2. Check whether Priyanshu/Harsh/Adi's module depends on it.
3. Tell the team (flag it in `PROJECT_STATUS.md`).
4. Make the change carefully.
5. Test affected functionality across modules.

## 21. Rules for Documenting Important Architectural Decisions

Document meaningful decisions (e.g. exact consent-state machine, exact override mechanism for application-specific data) in the repository so another team member can understand the system without re-reading the whole Claude conversation. Any change that qualifies as a **major architectural change** (a fundamentally different consent model, a different credential-verification approach, a different application-data storage pattern) must go through the process in `MASTER_SPECIFICATION.md` §32: stop, explain, check impact, get team-lead approval, update the spec, then implement.

## 22. Rules for Reporting Blockers/Dependencies

Record blockers and cross-module dependencies in `PROJECT_STATUS.md` as soon as they're identified — don't wait until integration day. Communicate anything urgent to Priyanshu directly as well, especially anything touching data privacy or the shared schema.

## 23. Definition of "Done" (for Anchal's Work)

A feature is done when: it's implemented, it builds/runs, it's been tested against real grant/deny/expired consent scenarios and real (mocked) verification transitions, it correctly enforces data minimization end to end, it doesn't break Adi's or Harsh's existing flows, the relevant `PROJECT_STATUS.md` box is checked with confidence, and any new interface (consent shape, authorization check, credential metadata shape) is documented for the rest of the team.

## 24. Development Workflow

```
PLAN → INSPECT → IMPLEMENT → TEST → VERIFY → UPDATE STATUS → COMMIT → PUSH
```

- **Plan:** briefly explain understanding of the task and propose an approach before writing code.
- **Inspect:** check current repo state, `PROJECT_STATUS.md`, and relevant existing consent/document/application code.
- **Implement:** build the smallest correct version first (e.g. get grant/deny working with one field before generalizing to arbitrary field sets).
- **Test:** run through §12.
- **Verify:** walk through the checklist in §13.
- **Update status:** reflect real, verified progress in `PROJECT_STATUS.md`.
- **Commit:** meaningful commit message, `git status`/`git diff` reviewed first.
- **Push:** to the feature branch; open/update a PR when ready for integration.

## 25. Engineering Judgment

The Master Specification intentionally leaves some implementation details open (exact consent-reference format, exact verification-status state-machine transitions, exact override storage mechanism). Use good engineering judgment to fill these gaps in a way that's simple, auditable, and testable — and clearly label these as engineering decisions, not spec requirements, when reporting back.

## 26. No Unsupported Government Integrations / Production Capabilities

Do **not** claim real trusted-issuer integration, real digital signatures, or real government verification unless such capability genuinely exists (`MASTER_SPECIFICATION.md` §6, §23, §36, §59 claims table). The prototype's verification is simulated via a mock issuer — this must be clear in code, comments, and any demo narration. Never let the system present `USER_PROVIDED` data as `VERIFIED` without an actual (mocked) verification step happening.

## 27. Preserve the Core OTR-India Concept

OTR-India is not "one giant database" and is explicitly designed around **data minimization and a federated credential model**, not "store everything centrally and trust it" (`MASTER_SPECIFICATION.md` §4, source SIH doc §6–9). Anchal's module is where that principle either holds or quietly breaks. Every design decision here should reinforce: citizen-provided ≠ verified, only-requested-and-granted fields are shareable, and the master profile stays intact even when an application needs a different value.

---
*OTR-India | SIH Internal Hackathon | Anchal Developer Instructions v1.0*
*Consolidated from MASTER_SPECIFICATION.md, TEAM_WORKFLOW.md, and the team's stated role assignment for Consent + Document/Data Management + Application Flow.*
