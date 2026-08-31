# PRIYANSHU_DEVELOPER_INSTRUCTIONS.md

Repository version — Team Lead + Foundation + Integration responsibilities for OTR-India.

> This is the repo-visible summary of Priyanshu's role, so Harsh, Adi, Anchal (and their Claude environments) understand what to expect from the team lead and how to coordinate with him. A more detailed personal working prompt exists separately for Priyanshu's own Claude conversations; this file is the shared, canonical version.

---

## 1. Role

Priyanshu is Team Lead + Foundation + Integration developer on OTR-India, a 4-person SIH team (Priyanshu, Harsh, Adi, Anchal) building one project through one shared GitHub repository.

## 2. Primary Responsibilities

- Establish the initial project foundation (structure, basic frontend/backend, DB connection, common config, initial API structure, shared data models, basic auth structure, dev conventions) so the other three developers have a stable base — **not** to build the entire project alone.
- Own architecture consistency across the four modules.
- Own final integration of Harsh's, Adi's, and Anchal's work into one coherent product.
- Maintain `MASTER_SPECIFICATION.md` and `TEAM_WORKFLOW.md`, and keep them the source of truth over any single Claude conversation's memory.
- Coordinate cross-module API compatibility.
- Own final testing and final demo-flow readiness for the SIH presentation.

## 3. How Priyanshu Coordinates With the Other Three

- Design every shared API, database model, or component with the actual consumer (Harsh/Adi/Anchal) in mind: what will they need, what will the response look like, can they integrate easily.
- Establish API contracts clearly before parallel development goes deep: endpoint, method, request/response structure, auth requirements, error responses, expected types.
- Before changing anything shared (schema, shared components, auth, common config), check who depends on it and communicate the change — flag it in `PROJECT_STATUS.md` under **Known Blockers / Dependencies** and tell the team directly.
- Don't assume another developer's implementation is wrong just because it differs from what Priyanshu would have written — understand what they built and why before proposing a change.

## 4. Working With Claude / Claude Code

- **Understand before implementing:** for any meaningful task, work through Understand → Inspect current repo → Understand existing implementation → Identify dependencies → Consider approaches → Choose the best practical one → Plan → Implement → Test → Verify → Report.
- **Use independent judgment.** Claude should not treat Priyanshu's first idea as a finished spec — it should flag a better approach when it sees one, and say so directly rather than silently agreeing.
- **Don't overengineer.** This is an SIH hackathon prototype: prefer the simpler working approach unless the more complex one gives a meaningful, necessary advantage. The exception is anything touching authentication, authorization, personal data, consent, document access, API security, data integrity, token generation, or database relationships — those deserve proper engineering even under time pressure.
- **Repository over memory.** The current repository state — not a previous Claude conversation, not an old snippet — is the source of truth. Inspect current git state, branch, and recent commits before significant work.
- **Don't ask unnecessary questions.** If a task is clear enough, make a reasonable engineering call and proceed; only ask when a decision genuinely affects project direction or needs information Claude can't reasonably determine.

## 5. Repository Inspection Habits

Before significant work: check `git status`, current branch, recent relevant commits, and whether Harsh/Adi/Anchal have touched related files. Read `PROJECT_STATUS.md` first to see what's actually done vs. in progress.

During active work on a task already underway: don't repeatedly pull `main` before every small edit — that interrupts flow and risks clobbering uncommitted work. Stay aware of relevant changes elsewhere without syncing constantly.

Before merging/integrating: sync with latest `main`, resolve conflicts carefully, run tests, verify integration, then commit/push and open/update the PR.

## 6. Git Discipline

- Meaningful commits (`feat: add OTR profile API`), not `update`/`final`/`final-final`.
- `git status` + `git diff` before every commit.
- Don't commit unrelated changes or force-push without explicit team approval.
- Before any destructive operation (`reset`, `rebase`, force-push, a `checkout`/`restore` that discards work, branch deletion) — stop and explain the consequence first. Three other people may have uncommitted or recent work in the repo.

## 7. Integration Responsibilities

- Integrate progressively (foundation+backend → backend+frontend → OTR+Portal A → OTR+Portal B → consent/interoperability/applications/dashboard → full demo), not in one giant merge at the deadline.
- After every merge, re-verify that the existing core flow still works (auth → OTR profile → consent → application → dashboard) — a new feature must not silently break the demo.
- Track cross-module dependencies and blockers explicitly in `PROJECT_STATUS.md` (e.g. "Harsh's connector will need to consume the updated profile API response").

## 8. Major Architectural Decisions

If Priyanshu or Claude believes a major architectural change is needed (framework, database, auth system, folder structure, API architecture, deployment approach):

1. Stop before implementing.
2. Explain the current approach, the problem, the proposed change, and the impact on other modules.
3. Get team agreement.
4. Update `MASTER_SPECIFICATION.md` if approved, and inform Harsh, Adi, and Anchal.
5. Implement consistently across the codebase.

Don't make these changes just because a different technology looks nicer — stability matters more than novelty on a shared, four-person, deadline-bound codebase.

## 9. Using `PROJECT_STATUS.md`

- Read it before starting significant work, to know what the other three have completed or are mid-way through.
- Update it after finishing a meaningful, **verified** feature — never mark something done that hasn't actually been tested.
- Record any dependency, blocker, API requirement, or integration issue your work creates for another developer.

## 10. Verifying Work Before Calling It "Done"

Before saying a feature is complete, check: **Code** (compiles/builds, correct imports/types, no obvious bugs) → **Runtime** (app starts, feature actually works) → **Integration** (works with existing APIs, doesn't break another module) → **Security** (no exposed secrets, correct permissions) → **Git** (know exactly what files changed and why). "Claude generated the code" is not completion — it has to actually run and be understood.

## 11. Protecting Other Developers' Work

- Avoid unnecessary changes outside your own assigned responsibility.
- Treat shared infrastructure (schema, shared components, auth, config) as something to change carefully and communicate about, not casually.
- Never use a destructive git operation that could discard someone else's uncommitted or recent work without explaining the consequence first and getting confirmation.

## 12. Deadline Awareness

Target: complete working prototype by ~September 4, 2026. September 5–6 is presentation/demo prep (avoid major architecture changes then). September 7 is the SIH presentation. When suggesting features, flag anything not essential to the core demo as optional/postponable, and prioritize in this order: core functionality → integration → security & correctness → testing → UI/UX → optimization → extra features.

---
*OTR-India | SIH Internal Hackathon | Repository version of Priyanshu's developer instructions v1.0*
*Condensed from the full personal PRIYANSHU_DEVELOPER_INSTRUCTIONS.md working prompt for repository/team visibility.*
