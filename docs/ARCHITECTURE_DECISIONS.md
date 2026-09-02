# OTR-India — Architecture Decisions (Foundation)

Log of significant technical decisions made while building the foundation
(`feature/priyanshu-foundation`). Per `TEAM_WORKFLOW.md` §21/§22 and
`MASTER_SPECIFICATION.md` §32, decisions here should be understandable
without reading the Claude conversation that produced them.

---

## 1. Backend stack: Node.js + TypeScript + Express

**Decision:** Node.js/Express + TypeScript, one of the three options `MASTER_SPECIFICATION.md` §28
already proposed (vs. FastAPI or Spring Boot).

**Why:** Shared language with the frontend (React/TS) means canonical types
(`src/types/canonical.ts`) can eventually be shared or mirrored 1:1 between
frontend and backend without a translation layer. Express is small,
well-understood, and doesn't fight the "don't over-engineer" principle in
§31 — no framework-level ceremony beyond what the project needs.

**Status:** Engineering decision made autonomously per team-lead instruction
("make the call, don't ask unless genuinely blocked"). Not a deviation from
the spec — §28 explicitly listed this as an acceptable option.

---

## 2. Database ORM: Drizzle, not Prisma

**Original plan:** Prisma, since it's the most common pairing with this
stack and gives a nice migration workflow.

**Problem encountered:** Prisma's client requires downloading a native
query-engine binary from `binaries.prisma.sh` at `generate`/`install` time.
That domain returned `403 Forbidden` from this build environment's network
allowlist — confirmed directly (not assumed), and it's not a transient
failure: the domain simply isn't reachable here in the same way
`registry.npmjs.org` is.

**Decision:** Switched to **Drizzle ORM** + the plain `pg` driver.
Drizzle is pure TypeScript — no native binary, no post-install network
fetch. Schema, migrations, and the query API are conceptually equivalent
to Prisma's for this project's needs.

**Impact:**
- Database is still **PostgreSQL** — no change to §28's DB choice.
- Same canonical table shapes as originally planned (`users`, `profiles`,
  `addresses`, `education`, `credentials`, `consents`, `applications`,
  `application_data`, `access_requests`, `audit_logs` — matches §18).
- If Harsh, Adi, or Anchal's own environment *can* reach
  `binaries.prisma.sh`, nothing stops them from using `@prisma/client` in
  a module that talks to the same Postgres database — but the shared
  `backend/` foundation code uses Drizzle, and new shared-schema changes
  should go through `backend/src/db/schema.ts`, not a second ORM's schema
  file. Two ORMs both writing migrations against the same DB would be a
  real problem — flag it in `PROJECT_STATUS.md` before doing that.

**Classification:** Implementation-level decision, not the kind of "major
architectural change" `MASTER_SPECIFICATION.md` §32 requires stopping for
(same DB, same schema, same server framework) — but documented here since
it's a real deviation from the spec's suggested tooling and another
developer's environment might behave differently.

---

## 3. Password hashing: Node's built-in `scrypt`, not bcrypt/argon2

**Why:** Avoids adding a dependency with native bindings (bcrypt) that
could hit the same kind of binary-fetch/build issue as Prisma did. Node's
`crypto.scryptSync` is built in, well-reviewed, and sufficient for a
demo-data hackathon prototype. Production use would warrant revisiting
(e.g. argon2id with tuned parameters), but that's explicitly out of scope
per `MASTER_SPECIFICATION.md` §36.

---

## 4. ID generation: `crypto.randomUUID`, not cuid2/nanoid

**Why:** One fewer dependency; Node's built-in UUID v4 generator is
cryptographically random and sufficient for internal row IDs. OTR IDs and
application reference IDs (the citizen/portal-facing identifiers) use a
separate, explicit generator (`src/utils/idGenerator.ts`) built on
`crypto.randomBytes`, matching the non-PII-derivable requirement in
`MASTER_SPECIFICATION.md` §12. These are two different concerns — internal
primary keys vs. citizen-facing identifiers — and are intentionally kept
in separate utilities.

---

## 5. Auth: demo email/password + JWT, not OTP simulation (yet)

**Why:** `MASTER_SPECIFICATION.md` §15 allows either OTP simulation or
email/password for the prototype. Email/password + JWT is the smaller,
faster-to-verify path for standing up the foundation's auth *boundary*
(`requireAuth` middleware) that the other three modules build behind. OTP
simulation can be layered on later as an alternative login route without
changing the boundary — the JWT contract (`Authorization: Bearer <token>`)
stays the same either way. Not a rejection of OTP — just sequencing.

---

## 6. What was deliberately NOT built in this pass

Per the team-lead instructions ("don't build Harsh's/Adi's/Anchal's
modules"), the foundation stops at:

- **Schema shape only** for `consents`, `applications`, `application_data`,
  `access_requests` — no grant/deny logic, no application submission flow,
  no override logic. That's Anchal's module.
- **No mock portals, no field-mapping layer, no connector structure.**
  That's Harsh's module. The canonical types in `src/types/canonical.ts`
  are the contract his mapping layer should target.
- **No frontend application logic** beyond a placeholder page proving the
  frontend can reach the backend's `/api/health` endpoint. That's Adi's
  module.
- **No credential verification simulation** — the `credentials` table
  exists with the right shape and status enum, but no mock-issuer logic.
  That's Anchal's module.
