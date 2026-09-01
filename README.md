# OTR-India — Anchal's Module (Consent + Document/Data Management + Application Flow)

Standalone, independently-runnable prototype of Anchal's module, built **before**
Priyanshu/Harsh/Adi have generated any code. This is meant to be integrated into
the shared `OTR-India` repo/schema once the foundation lands — see "Integration
notes" below for exactly what will need to change.

## What this is

- Consent request → grant/deny/revoke, with expiry, and data-minimization
  enforced *at the point of granting* (you cannot approve a field that was
  never requested).
- Credential/document **metadata** model with the required verification
  lifecycle (`USER_PROVIDED → PENDING_VERIFICATION → VERIFIED / REJECTED`,
  plus `EXPIRED` / `REVOKED`), driven by a clearly-labeled mock issuer.
- A single authorization/data-minimization check
  (`isFieldAuthorized` / `getAuthorizedFields`) meant to be the one place
  Harsh's connectors call before releasing any field to a portal.
- Application flow: create → attach consent → application-specific data /
  per-application overrides → validate → submit → application reference ID
  generation (`APP-<PORTAL>-<YEAR>-XXXX`).
- Audit logging of events (not sensitive values) per the event vocabulary in
  `MASTER_SPECIFICATION.md` §24.

## What this is NOT

- Not connected to any real database — `src/utils/store.js` is a deliberate
  in-memory placeholder for Priyanshu's future PostgreSQL schema. Data is
  lost on restart. See "Integration notes."
- Not connected to real authentication — no auth/session logic exists here;
  every service trusts the `otrId` it's given. Wiring in Priyanshu's real
  auth is a listed dependency, not something faked here.
- Not connected to Adi's UI or Harsh's connectors — this exposes clean
  HTTP APIs for them to call, but nothing about their side is implemented.
- Not real verification — `src/services/mockIssuer.js` is explicitly a
  simulated issuer, per `MASTER_SPECIFICATION.md` §6/§23/§36 and
  `ANCHAL_DEVELOPER_INSTRUCTIONS.md` §26. Never claim this as real
  government/issuer integration in the demo.
- Not profile versioning — `profileVersionRef` exists as a field on
  applications but is not enforced/populated; it depends on Priyanshu's
  profile-versioning support, which doesn't exist yet.

## Running it

```bash
npm install
npm test        # runs all 35 tests (jest)
npm start        # boots the Express app on PORT (default 4001)
curl http://localhost:4001/health
```

## Project layout

```
src/
 ├── app.js                    Express app factory (routes mounted here)
 ├── server.js                 Entry point (binds a port)
 ├── services/
 │    ├── consentService.js        Consent state machine
 │    ├── authorizationService.js  Data-minimization enforcement point
 │    ├── credentialService.js     Credential metadata + verification lifecycle
 │    ├── mockIssuer.js            Simulated issuer (clearly labeled)
 │    └── applicationService.js    Application create/data/validate/submit
 ├── controllers/               Thin HTTP <-> service glue
 ├── routes/                    Express routers per resource
 └── utils/
      ├── store.js               In-memory tables (placeholder for shared DB)
      ├── ids.js                 ID generation (never derived from PII)
      ├── audit.js               Audit event logging
      └── respond.js             Consistent { success, data|error } responses

tests/
 ├── consent.test.js
 ├── authorization.test.js
 ├── credential.test.js
 ├── application.test.js
 ├── security.test.js
 └── api.smoke.test.js          End-to-end HTTP happy path
```

## API surface (current)

```
POST /api/consent/request
POST /api/consent/:id/grant        { approvedFields: [...] }
POST /api/consent/:id/deny
POST /api/consent/:id/revoke
GET  /api/consent/:id
GET  /api/consent/otr/:otrId

POST /api/credentials              { otrId, type, reference?, issueDate?, expiry?, documentRef? }
GET  /api/credentials/:id
GET  /api/credentials/otr/:otrId
POST /api/credentials/:id/request-verification
POST /api/credentials/:id/verify           (runs the mock issuer)
POST /api/credentials/:id/revoke

POST /api/applications             { otrId, portalId, consentId?, profileVersionRef? }
GET  /api/applications/:id
GET  /api/applications/otr/:otrId
POST /api/applications/:id/data    { fieldName, fieldValue, isOverride? }
GET  /api/applications/:id/data
GET  /api/applications/:id/validate
POST /api/applications/:id/submit

POST /api/authorization/check      { consentId, field } -> { authorized: boolean }
POST /api/authorization/fields     { consentId, fullProfileData, requestingSystem? }
```

Response shape: `{ success: true, data }` or `{ success: false, error: { code, message } }`.
These endpoint paths, naming conventions, and response shapes are a proposal —
**not final** until reconciled against whatever conventions Priyanshu's
foundation establishes.

## Integration notes (read before merging into the shared repo)

1. **Storage.** Replace `src/utils/store.js`'s `Table` methods with real
   queries against Priyanshu's schema (`consents`, `credentials`,
   `applications`, `application_data`, `audit_logs` — matches
   `MASTER_SPECIFICATION.md` §18). Services only call `db.<table>.get/set/find/getAll`,
   so this should be the only file that needs to change shape-for-shape.
2. **Auth.** Every service currently trusts the `otrId` passed in. Once
   Priyanshu's auth exists, the controllers should derive `otrId` from the
   authenticated session/token rather than the request body, and reject
   requests where the caller isn't authorized to act as that OTR ID.
3. **Mounting.** `src/app.js` mounts routers under `/api/consent`,
   `/api/credentials`, `/api/applications`, `/api/authorization`. These can
   be `app.use()`'d directly into Priyanshu's main Express app instead of
   running as a separate server — no route logic needs to change.
4. **Harsh's connectors.** Should call `POST /api/authorization/check` or
   `POST /api/authorization/fields` before returning any field to a portal,
   rather than re-implementing the "is this field authorized" check.
5. **Adi's UI.** Consumes the consent request/grant/deny endpoints and the
   credential verification-status endpoints; this module owns the data and
   authorization logic, Adi owns presentation.
6. **Profile versioning.** `applicationService.createApplication` accepts
   `profileVersionRef` but doesn't populate or enforce it — needs
   Priyanshu's versioning support before this is real.

## Test coverage (35 tests, all passing)

- Consent: create, grant, deny, revoke, expiry (lazy check), invalid
  consent ID, illegal state transitions, minimization enforced at grant time.
- Authorization/data minimization: approved-only fields returned, full
  profile never returned, denied/revoked/unknown consent yields nothing,
  single-field check matches bulk check.
- Credentials: `USER_PROVIDED → PENDING_VERIFICATION → VERIFIED/REJECTED`,
  illegal transitions rejected, resubmission after rejection, revoke/expire.
- Applications: create/validate/submit/generate ID, blocked on non-ACTIVE
  consent, per-application overrides isolated from any master profile,
  no post-submission mutation, IDs not derivable from PII.
- Security: forged/unknown consent ID handled safely, pending consent
  authorizes nothing, credential metadata never carries binary content,
  audit logs never contain raw field values.
- API smoke test: full consent → credential → application HTTP happy path.
