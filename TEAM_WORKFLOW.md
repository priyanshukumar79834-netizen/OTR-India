# OTR-India — Team Workflow

Version 1.0 | SIH Internal Hackathon

> Read this alongside `MASTER_SPECIFICATION.md` (what we're building) and `PROJECT_STATUS.md` (what's actually done right now).
> This document describes **how the four of us work together** — not the product architecture.

---

## 1. Team

| Member | Responsibility |
|---|---|
| **Priyanshu** | Team Lead + Foundation + Integration |
| **Harsh** | Government Interoperability + Portal Connectors |
| **Adi** | Citizen Application + OTR Frontend + Dashboard |
| **Anchal** | Consent + Document/Data Management + Application Flow |

All four members build the **same** project and follow the **same** Master Specification. Exact file/directory ownership within each module should be confirmed with Priyanshu as the foundation lands, since it isn't fully fixed yet.

## 2. Development Approach

We are **not** building four separate projects and merging them at the end. We are building **one project, one GitHub repository, multiple development branches, and four separate Claude environments** (one per developer).

Central repository: `OTR-India` — `github.com/priyanshukumar79834-netizen/OTR-India` (private).

No developer should maintain a completely separate copy of the project. The GitHub repository is the central source of truth for the actual codebase.

## 3. Claude Development Environments

Each developer has their own Claude environment/project, and each should have access to:

```
MASTER_SPECIFICATION.md
TEAM_WORKFLOW.md
+ that developer's own instructions
```

**Important rule for every Claude instance:** Claude must not treat its own conversation memory as the source of truth. The **repository and shared specification files win** over anything Claude remembers from an earlier conversation. If the repo has moved on since a prior chat, adapt to the current repo.

## 4. Priyanshu's Role (Team Lead)

```
Project planning → Master specification → Initial project foundation →
GitHub repository → Module assignment → Parallel development →
Integration → Testing → Final prototype
```

Priyanshu establishes the initial, **minimal and functional**, foundation so the other three don't start from unrelated implementations — e.g. project structure, basic frontend/backend setup, DB connection, common config, initial API structure, shared data models, basic auth structure, dev conventions, initial docs. Priyanshu should **not** try to build every feature alone before giving the others access.

Ongoing responsibilities: architecture consistency, integration, the GitHub repository, the Master Specification, cross-module API compatibility, final testing, final demo flow, final presentation readiness. This doesn't mean writing every line of code — it means making sure the four pieces become one coherent product.

## 5. Module-Based Development

After the foundation lands, each developer gets:

```
Master Specification + Team Workflow + Personal Developer Instructions + GitHub Repository
```

Personal instructions should say exactly: what module you own, what to build, which files/directories you primarily touch, which APIs you consume vs. provide, what **not** to modify without discussion, what tests you need, and what "done" means for your module.

## 6. Branch Strategy

`main` represents the stable, integrated project. Each developer works primarily on their own feature branch:

```
main
 ├── feature/priyanshu-foundation
 ├── feature/harsh-interoperability
 ├── feature/adi-frontend
 └── feature/anchal-consent
```

(Branch names can be refined once the foundation lands — the pattern is `feature/<developer>-<module>`.)

**`main` stays stable — no direct experimentation on `main`.** Flow: feature branch → test → commit → push → pull request → review → merge into `main`.

**No ZIP-based integration.** Don't pass zipped snapshots around and "somehow merge them later" — that creates unnecessary conflicts and ambiguity about which version is correct. Everyone works from the same GitHub repo on their own branch, merged through PRs.

## 7. Before Starting Significant Work

1. Check `git status` and current branch.
2. Inspect recent repository changes / relevant recent commits.
3. Inspect the files you're about to touch.
4. Read `PROJECT_STATUS.md` to see what the others have completed or are mid-way through.
5. Decide whether you need to pull in the latest `main`/relevant branch changes before beginning.
6. Then begin implementation.

**During active, in-progress work:** don't repeatedly pull `main` before every small file edit — that interrupts flow and can create unnecessary conflicts with your own uncommitted changes. Keep track of what else may be relevant outside your module, and inspect those changes when they become relevant, rather than syncing before every keystroke.

**Before integration/merging your feature:** pull latest `main` → resolve conflicts carefully → run tests → verify integration → commit/push → open or update the PR.

Nobody should perform destructive git operations (`reset`, `rebase`, `push --force`, a `checkout`/`restore` that discards changes, branch deletion) without first explaining the consequences — three other people may have uncommitted or recently committed work.

## 8. Shared Code

Some files are shared across modules: database schema, API contracts, authentication, shared types, environment configuration, common components. Don't change these casually. If you need to change shared code:

1. Explain why it's needed.
2. Check whether another module depends on it.
3. Tell Priyanshu/the team.
4. Make the change carefully.
5. Test affected functionality.

## 9. API Contracts

Before parallel development goes deep, agree on the major API contracts (endpoints, methods, request/response shape) so nobody independently invents an incompatible API. Example shape (not final):

```
GET  /api/otr/profile
POST /api/otr/profile
POST /api/consent
GET  /api/applications
POST /api/applications
```

**Don't assume another developer's implementation.** Inspect the actual API docs/code/types/schema/response before building against it. If it's unclear, flag it rather than inventing a different structure.

## 10. Communication Between Developers

Because the four Claude environments can't see each other's conversations, important changes travel through:

- **GitHub** — code and commits (the primary channel)
- **Documentation** — API/schema/architecture changes go into the relevant `.md` file
- **Team communication** — for decisions and breaking changes, outside of Claude

## 11. Commit Discipline

Good: `feat: implement OTR profile API`, `feat: add consent management`, `feat: create government portal connector`, `fix: validate application request`, `test: add consent API tests`.

Avoid: `update`, `final`, `final2`, `changes`, `working now`.

Prefer small, frequent commits (small change → test → commit → push) over multi-day mega-commits that break everything at once. Don't commit unrelated changes, generated junk, or build artifacts. Run `git status` and `git diff` before committing so you know exactly what changed.

## 12. Integration Strategy

Don't wait until the deadline to combine everything — integrate progressively:

```
Stage 1: Foundation + Backend
Stage 2: Backend + OTR frontend
Stage 3: OTR + Government Portal A
Stage 4: OTR + Government Portal B
Stage 5: Consent + Interoperability + Applications + Dashboard
Stage 6: Complete end-to-end demo
```

The first milestone the team should target is the **single complete journey**:

```
Login → OTR Profile → Government Portal → Use OTR → Consent →
OTR Data → Form Prefilled → Application-specific fields →
Submit → Application ID → Dashboard
```

Once that works, expand outward.

## 13. Repository Layout (indicative)

```
OTR-India/
 ├── frontend/
 ├── backend/
 ├── database/
 ├── interoperability/
 ├── docs/
 ├── README.md
 ├── MASTER_SPECIFICATION.md
 ├── TEAM_WORKFLOW.md
 ├── PROJECT_STATUS.md
 ├── .gitignore
 └── .env.example
```

Exact structure may change as the technical architecture is decided — don't create directories just because this list mentions them.

## 14. Environment Variables & Secrets

Use env vars for all secrets/config (`DATABASE_URL`, `JWT_SECRET`, `API_URL`, ...). Never commit `.env` if it holds secrets — provide `.env.example` with just the variable names. AI assistants must never generate or commit real API keys, passwords, private credentials, real government credentials, or real citizen data — use placeholders/demo values only.

## 15. Dummy Data Only

All development and demos use fictional data (e.g. `Priyanshu Demo`, `demo@example.com`, `9000000000`). No real personal documents in the repository, ever.

## 16. When a Problem Comes Up

```
Understand problem → Inspect existing code → Check specification →
Check API/data contracts → Determine smallest safe change →
Implement → Test → Explain the change
```

Don't rewrite large portions of the project just because an error appeared.

## 17. No Unnecessary Rewrites

If something already works, don't rewrite it just because another approach looks cleaner. Especially avoid replacing the frontend, rewriting backend architecture, changing frameworks/database systems, or renaming major APIs without team approval.

## 18. Adding a Dependency

Before adding a new package, ask: is it actually necessary? does the project already have an equivalent? will it complicate deployment or conflict with existing deps? is it reliable enough for a hackathon timeline? Prefer the simpler solution.

## 19. Before Pushing / "Done" Checklist

```
Build → Run tests → Run the app → Test the affected feature →
Check console/errors → Commit → Push
```

"Implementation complete" from Claude is not the same as "it works." Verify it actually runs. After any merge, re-check that existing core functionality still works: authentication, OTR profile, consent, data retrieval, government portal, application submission, dashboard. A new feature must not silently break the existing demo.

## 20. Deadline Strategy

- **Target: complete working prototype by ~September 4, 2026.**
- **September 5–6:** presentation prep, demo rehearsal, architecture/problem-statement explanation, screenshots, pitch, anticipated judge questions, backup demo prep. Avoid major architectural changes in this window unless absolutely necessary.
- **September 7:** SIH Internal Hackathon presentation.

**Feature freeze around September 4:** after that, fix bugs and polish rather than adding new features. Reliable beats huge — a smaller system that works perfectly beats a large one that crashes mid-demo.

## 21. Decision-Making

```
Developer/Claude suggestion → Team discussion → Decision →
Documentation → Implementation
```

We don't let four Claude instances independently evolve four different versions of the architecture.

**Claude's role:** write code, explain code, debug, suggest improvements, generate tests, help with docs. **The team decides:** architecture, scope, technology, APIs, security approach, feature priority, major changes.

## 22. Keeping the Four Claude Projects Consistent

Each Claude Project should have `MASTER_SPECIFICATION.md`, `TEAM_WORKFLOW.md`, and that developer's own instructions. When architecture changes meaningfully:

```
Update shared documentation → Commit to GitHub → Inform all developers →
Update each Claude Project if necessary
```

This avoids a situation where each developer's Claude has quietly drifted onto a different mental model of the architecture.

## 23. The Golden Rule

We are not building four modules. We are building **one product** through four development environments. The code, responsibility, and Claude Projects may be divided — **the project itself is not divided.** Everything integrates into one working OTR-India prototype for the SIH presentation.

## 24. `PROJECT_STATUS.md` — Shared Live Status

`PROJECT_STATUS.md` is the team's live, human/AI-readable progress tracker (Git history remains the actual source of truth for code). Every developer must:

1. Read it before starting significant work.
2. Check the other developers' current status when relevant to your task.
3. Update it after completing a meaningful feature.
4. Record blockers or cross-module dependencies as they occur.
5. **Never mark something complete unless it's actually implemented and verified.**
6. Keep it concise and factual.

## 25. Final Team Objective

By the deadline: one GitHub repository, one coherent codebase (not four independent projects), four development environments, one shared Master Specification, one shared Team Workflow, four role-specific instruction sets, and **one integrated prototype** demonstrating OTR + Consent + Data reuse + Interoperability + Government application integration + Application tracking.

---
*OTR-India | SIH Internal Hackathon | Team Workflow v1.0*
*Source: OTRINDIATEAMWORKFLOW.pdf and PRIYANSHU_DEVELOPER_INSTRUCTIONS.md, consolidated for the repository. Role assignments (Harsh/Adi/Anchal) as specified by the team lead.*
