# OTR-India — Master Project Specification

Version 1.0 | Smart India Hackathon (SIH) Internal Prototype

> This document is the technical source of truth for what we are building.
> If any AI suggestion (including from Claude) conflicts with this document, **this document wins**.
> See `TEAM_WORKFLOW.md` for how we work together, and `PROJECT_STATUS.md` for what's actually built right now.

---

## 1. Project Identity

- **Project name:** OTR-India
- **Meaning:** One-Time Registration and Interoperability Framework for Government Applications
- **Hackathon:** Smart India Hackathon (SIH)
- **Problem Statement:** PS 26129 — System integration and interoperability among government digital platforms, resulting in fragmented service delivery.

## 2. Core Idea

Today, a citizen repeatedly provides the same information — name, DOB, parents' names, mobile, email, address, category, educational qualifications, marksheets, certificates — to different government portals for different exams, jobs, scholarships, and services.

OTR-India lets a citizen create an **OTR profile once**, securely store/manage reusable information and credentials, and reuse that information across participating government applications, with consent, instead of re-entering it every time.

Target citizen experience:

```
Register once
  ↓
Maintain verified/reusable profile
  ↓
Choose a government application
  ↓
Authenticate
  ↓
Give consent
  ↓
OTR provides permitted information
  ↓
Application-specific information is entered
  ↓
Submit application
  ↓
Receive application/reference ID
```

## 3. The Problem We Are Solving

**Citizen-side:** time consumption, repetitive work, frustration, manual-entry mistakes, repeated document handling, privacy concerns, difficulty for less technically experienced citizens, dependency on / repeated waiting at cyber cafés.

**Government-side:** repeated collection of the same citizen information, duplicate data storage, repeated document transfers and processing, multiple systems maintaining similar information, data synchronization challenges, fragmented citizen experience.

OTR-India addresses this through **interoperability and controlled reuse**, not by replacing every existing government system.

## 4. Important Architectural Principle

OTR-India does **not** mean "delete all government databases and put everything into one giant database." Departments may still need to maintain application-specific records required by law, policy, audit, or operations.

Instead, OTR-India aims to **reduce unnecessary repeated collection and duplication of reusable citizen information through a secure interoperability layer and controlled data sharing.**

This distinction must be maintained in code, docs, and the pitch.

## 5. Three Categories of Data

A clean architecture separates citizen information into three categories:

1. **Common profile data** — name, DOB, parent/guardian details, contact info, address: frequently required by many applications. OTR maintains this reusable profile.
2. **Credentials** — 10th/12th/graduation marksheets, caste/domicile/income certificates, etc. OTR does not just store the raw file; it maintains credential metadata: `id`, `type`, `issuer`, `verificationStatus`, `issueDate`, `expiry`, `reference`.
3. **Application-specific data** — fields only one particular application needs (e.g. exam centre, post preference, department preference). This stays scoped to that application, not the master profile.

**OTR is not a document dump.** Where possible, use structured data instead of repeatedly transferring entire documents. Think of OTR as: Citizen Profile + Structured Data + Credentials/Documents + Verification Metadata + Consent + Authorization + Interoperability + Audit Trail.

## 6. Verification Model — OTR Does Not Decide Truth

OTR must distinguish **citizen-provided** information from **issuer-verified** information. Uploading a document does not make it verified.

Credential status lifecycle: `USER_PROVIDED → PENDING_VERIFICATION → VERIFIED` (also `REJECTED`, `EXPIRED`, `REVOKED`).

The issuer (e.g. an education board, mock in our prototype) remains the source of truth for a credential's authenticity — OTR references and displays that status, it doesn't invent it.

## 7. High-Level System Architecture

```
CITIZEN
  │
  ▼
OTR PORTAL
  │
  ▼
Authentication & Authorization
  │
  ▼
Consent Management
  │
  ▼
OTR / Interoperability Layer
  ├── API Gateway
  ├── Data Mapping
  ├── Validation
  ├── Policy / Access Control
  ├── Connector Layer
  └── Audit Logging
  │
  ┌────┴────┐
  ▼         ▼
Gov Portal A   Gov Portal B
(Mock SSC)     (Mock RRB)
```

This is a prototype architecture — **do not over-engineer it into dozens of microservices** unless there is a clear reason.

## 8. Participating Government Systems

We build **mock** government application portals for the prototype. Do not depend on real SSC/UPSC/RRB APIs unless officially available and legally/technically appropriate.

Example mock portals: `GovRecruit-A`, `GovRecruit-B` — each with a **different field-naming convention**, on purpose, to demonstrate interoperability.

## 9. Common (Canonical) Data Model

OTR maintains a canonical/internal data model that mock portals map to/from. Conceptual example (not final schema):

```json
{
  "identity": { "fullName": "...", "dateOfBirth": "...", "gender": "..." },
  "contact": { "mobile": "...", "email": "..." },
  "address": { "addressLine": "...", "city": "...", "state": "...", "pincode": "..." },
  "education": { "secondary": {}, "seniorSecondary": {}, "graduation": {} },
  "credentials": []
}
```

The real schema will be finalized during implementation.

## 10. Data Mapping (Interoperability)

The interoperability layer maps each external portal's field names to the canonical model, and back:

```
Government Portal A field: dob         →  OTR canonical: dateOfBirth
Government Portal B field: birth_date  →  OTR canonical: dateOfBirth
```

This is the core demonstration of PS 26129: different systems interoperate through standardized mapping without replacing their own internal formats.

## 11. Data Minimization & Consent

- OTR must **never send more information than the requesting application requires**. If a portal only needs Name, DOB, and 10th qualification, OTR does not also send phone, email, caste certificate, etc.
- Before sharing any data with an external application, the citizen sees an explicit **consent step** listing exactly which fields are requested (e.g. "This application requests: ✓ Name ✓ DOB ✓ Mobile ✓ 10th Qualification — [Allow & Continue] / [Cancel]").
- Consent events must be **traceable**: user, application, requested fields, grant/deny decision, timestamp, a consent reference (e.g. `CONSENT-XXXX`), stored in an audit/consent table.

## 12. Identifiers

- **OTR ID**: unique per citizen, e.g. `OTR-IND-8F3A92XXXX`. Must **not** be derivable from Aadhaar, phone, DOB, or email.
- **Application Reference ID**: unique per submitted application, e.g. `APP-SSC-2026-XXXX`. One OTR ID can have many application IDs underneath it.
- **Token / secure reference**: used for controlled data retrieval between a portal and OTR. A token is **not** proof that an application was fully submitted — the application submission itself must still be recorded separately. Never treat a token as a magic replacement for application records.

## 13. Application-Specific Overrides

A citizen may want different values per application (e.g. a different contact email). The **master OTR profile should not be modified** just because one application needs a different value — prefer an application-level override so the master profile stays intact.

```
Master OTR
  ├── Application 1: email → A
  └── Application 2: email → B
```

## 14. Document Handling & Access

- Document storage can be simulated with local/cloud object storage; don't store large binaries directly in relational DB fields without reason. Conceptually: PostgreSQL holds document *metadata*; actual files live in object storage.
- A government application gets access to a document only if: (1) it's relevant, (2) the application is authorized, (3) the citizen has consented where required, (4) the request passes validation/policy checks.

## 15. Authentication

For the hackathon: OTP simulation, email/password, or demo login are acceptable. **Do not claim production-grade Aadhaar, government-identity, or biometric authentication** unless it's actually implemented. Authentication and identity verification are separate concepts — don't conflate them.

## 16. Cyber Café / Assisted Access

OTR should support the real-world case of citizens using cyber cafés / assisted service centres — the operator shouldn't need to repeatedly re-collect the citizen's info, but also should **not** get unrestricted access to the citizen's whole OTR profile.

## 17. Security Principles

Authentication · Authorization · Consent · Data minimization · Encryption (in transit, and at rest where appropriate) · Audit logs · Role-based access control.

**Never commit:** `.env`, API keys, DB passwords, JWT secrets, private credentials, real citizen data, real government credentials. Use environment variables + `.env.example`, keep `.env` in `.gitignore`.

**Never use real citizen data** — Aadhaar numbers, PAN, real phone numbers, real certificates, real credentials. Use synthetic demo data only (e.g. `Priyanshu Demo`, `DOB: 2005-01-01`, `Mobile: 9000000000`).

## 18. Database Concept (indicative, not final)

Likely entities: `users`, `profiles`, `addresses`, `education`, `credentials`, `documents`, `consents`, `applications`, `application_data`, `access_requests`, `audit_logs`. Exact schema finalized during implementation; avoid unnecessary duplication and use relationships/references.

## 19. Storage/Benefit Framing — Be Careful With Claims

Illustrative model only: if a citizen's reusable info/documents are ~10MB, five separate applications *without* OTR could mean ~50MB of repeated common data (before app-specific data); *with* OTR, ideally just the 10MB plus small app-specific increments and only-required sharing. **This is an illustrative model, not a guaranteed real-world saving** — never present a specific percentage (e.g. "80% savings") as fact. Where possible, measure actual results from our own prototype (time to fill, repeated fields, repeated uploads) instead of inventing numbers.

Potential government-side benefits (not guarantees): reduced redundant collection/storage/transfer/processing, better data consistency and auditability, easier interoperability, faster processing.

Potential citizen-side benefits: faster applications, fewer manual errors, better visibility and control over shared data, easier assisted/cyber-café usage.

## 20. Dashboard

Sections: Personal Profile · Education · Credentials · Documents · Verification Status · Applications · Consent History · Access/Audit History. Each application entry shows: application name, government organisation, date, status, application ID.

## 21. Primary Demo Workflow (End-to-End)

1. Citizen creates account, completes OTR profile, adds education/credentials/documents; verification status shown.
2. Citizen opens Government Portal A, selects "Use OTR", authenticates.
3. Portal A requests specific fields; citizen reviews and grants consent.
4. OTR returns only the permitted information; the government form is populated.
5. Citizen adds application-specific info and submits; application ID is generated and appears on the dashboard.
6. Citizen repeats with Government Portal B — **different field names/mappings** demonstrate interoperability.
7. Dashboard shows both applications.

### Supporting demo stories
- **Different field formats:** Portal A `dob`, Portal B `birth_date`, OTR canonical `dateOfBirth` — both interoperate with OTR despite different structures. This is the PS 26129 core story.
- **Data minimization:** a portal requesting only Name, DOB, 10th Qualification receives only those fields.
- **Application-specific override:** master email stays `user@example.com`, Application B independently uses `alternate@example.com` without touching the master profile.

## 22. Existing-System Compatibility

We do **not** require complete replacement of existing government systems. Conceptually: `Existing Government System → Existing API/Connector → OTR Interoperability Layer → Canonical Data Model`. Mock connectors are sufficient for the prototype.

## 23. API-First Thinking & Contracts

Modules communicate through clearly defined APIs; don't tightly couple frontend directly to DB implementation. Before parallel development, agree and document: endpoint, HTTP method, request/response format, auth/authz requirements, error format, expected status codes. Example:

```
GET /api/otr/profile
Response: { "success": true, "data": { ... } }
```

API contracts are shared contracts, not something one developer changes unilaterally.

## 24. Error Handling & Audit Logging

Gracefully handle: invalid auth, expired sessions, invalid token/reference, missing required field, unauthorized data request, consent denied, credential unavailable, verification pending, portal unavailable, invalid application data. Never expose sensitive internal errors to users.

Log important events (not sensitive contents): `LOGIN`, `PROFILE_UPDATED`, `CONSENT_REQUESTED`, `CONSENT_GRANTED`, `CONSENT_DENIED`, `DATA_ACCESSED`, `DOCUMENT_ACCESSED`, `APPLICATION_CREATED`, `APPLICATION_SUBMITTED`. Each record: event, user/reference, requesting system, timestamp, result.

## 25. Role Model

- **Citizen:** manage profile/credentials, view applications, approve/deny consent, view access history.
- **Government Application:** request permitted information, receive authorized information, submit application info, view its own transactions.
- **Admin:** monitor system, view system-level audit info, manage participating applications/connectors — **not** unrestricted access to citizen data.

## 26. Frontend Principles

Simplicity, clarity, accessibility, mobile responsiveness, clear consent, clear verification status, clear application status. Avoid unnecessary animation/complexity — the demo should be understandable within seconds.

## 27. Demo Data

Seeded fictional demo citizen(s), mock government portals, and mock credential statuses (e.g. `OTR-IND-DEMO001`, 10th/12th verified, graduation pending). Fictional information only.

## 28. Proposed Technology Stack

Kept intentionally practical for a hackathon prototype — **final choice depends on team expertise and must be confirmed with the team lead before broad parallel development begins**:

- **Frontend:** React / Next.js
- **Backend:** Node.js + Express/NestJS, **or** Python + FastAPI, **or** Java + Spring Boot
- **Database:** PostgreSQL (structured relational data: users, profiles, credentials, applications, consent, audit)
- **Authentication:** OTP-based for the prototype, architected so it could later support stronger identity providers
- **API style:** REST
- **Deployment:** Docker (+ cloud deployment if required/time permits)

## 29. Feature Priority

**P0 — must work:** OTR registration, login/authentication, profile, reusable data, credential/document metadata, government portal integration, consent, data sharing, form prefill, application submission + application ID, dashboard, audit/consent history, interoperability/data mapping.

**P1 — should work:** credential verification simulation, application-specific overrides, multiple government portals, role-based access, better document handling, error handling.

**P2 — nice to have (drop first if time is short):** advanced analytics/notifications, advanced admin dashboard, more connectors, advanced verification mechanisms, production-grade deployment features.

## 30. Development Priority Order

Build the smallest complete end-to-end system first:

```
Authentication → OTR Profile → Government Portal → Consent →
Data Retrieval → Form Prefill → Application Submission → Dashboard
```

Only after this works end-to-end should secondary/P1/P2 features be added.

## 31. Don't Over-Engineer

This is a hackathon prototype. Do **not** unnecessarily introduce: dozens of microservices, Kubernetes, complex event buses, blockchain, "AI for decoration," complicated distributed systems, real Aadhaar integration, real government databases, or complex cloud infrastructure — unless there is a genuine prototype requirement. A clean monolithic backend + interoperability module is completely acceptable.

## 32. AI Development Rules

AI (Claude / Claude Code) may be used for code generation, debugging, refactoring, tests, documentation, UI generation, SQL, and API implementation — but **must follow this Master Specification** and must **not independently redesign the architecture** without team approval.

**Source-of-truth hierarchy:**
1. This Master Specification
2. Approved architecture/API decisions
3. Role-specific developer instructions
4. Existing repository implementation
5. Individual AI suggestions (lowest priority)

If an AI suggestion conflicts with the Master Specification, **the Master Specification wins.**

### Proposing an architectural change
1. Stop before implementing it.
2. Explain the problem and the proposed change.
3. Check impact on other modules.
4. Get team-lead approval.
5. Update this document if approved, and inform all developers.
6. Implement consistently.

Do not silently change shared architecture.

## 33. Git Rules (summary — see `TEAM_WORKFLOW.md` for full workflow)

One repository (`OTR-India`); `main` stays stable; each developer works on a feature branch (`feature/<developer>-<module>`); no ZIP-file "integration"; meaningful commit messages (`feat: add OTR profile API`, not `update`/`final2`).

## 34. Testing Expectations

At minimum: **Auth** (valid/invalid login) · **OTR** (create/update/retrieve profile) · **Consent** (grant/deny/expired-invalid) · **Interoperability** (field mapping, invalid/missing field) · **Application** (create/validate/submit/generate ID) · **Security** (unauthorized access, invalid token, access without consent).

The single most important test is the full integration path: `Citizen → OTR → Government Portal A → Consent → Data retrieval → Form prefill → Submit → Application ID → Dashboard`, then repeated with Portal B. **This must work before the September 4 feature freeze.**

## 35. Performance & Scalability (prototype-appropriate)

Prioritize correctness over extreme performance, but avoid unnecessary DB queries, avoid re-fetching the same data, return only required fields, paginate lists where sensible, avoid transferring large documents unnecessarily.

Design so additional government systems can be added later ideally via a new connector/config rather than a rewrite:

```
OTR → Interoperability Layer → Portal A / Portal B / Portal C ...
```

## 36. Future / Production Considerations (out of scope for the prototype)

Government-issued digital credentials, trusted issuer integration, strong identity verification, advanced consent management, federated identity, standardized APIs, government service registries, sophisticated policy engines, event-driven notifications, high availability, disaster recovery, HSMs, comprehensive compliance mechanisms. These are **not mandatory hackathon features.**

## 37. Important Claims Rule — What We Do and Don't Say

| Don't say | Say instead |
|---|---|
| "OTR will reduce government costs by exactly 80%." | "OTR has the potential to reduce redundant storage, repeated processing, data transfer and maintenance overhead." |
| "OTR eliminates all government databases." | "OTR reduces unnecessary duplication while allowing existing systems to continue operating." |
| "OTR automatically verifies every certificate." | "OTR can integrate with trusted verification sources; our prototype simulates verification." |
| "The token proves the application was submitted." | "The token/reference securely identifies or authorizes a particular data-sharing/application transaction." |

Other things we should not claim: that we can connect every legacy government system automatically, that a centralized database is inherently safer, that we've eliminated all storage duplication.

## 38. Success Criteria

A judge should be able to see: a citizen with an OTR profile applies to two different mock portals (different field names/requirements) **without** re-entering common information — authenticate → review requested data → consent → OTR provides permitted info → form populates → add app-specific info → submit. The dashboard shows both applications; the audit view shows the data-sharing activity; the interoperability layer visibly maps between different portal formats.

## 39. Core Value Proposition

- **For citizens:** enter reusable information once, reuse it across participating applications with consent.
- **For government:** reduce unnecessary repeated collection, transfer, and duplication of reusable citizen information while interoperating with existing systems.
- **For SIH PS 26129:** a secure, standards-oriented interoperability layer connecting fragmented government digital platforms without requiring complete replacement of existing systems.

## 40. One-Sentence Pitch

> "We are building a secure government interoperability layer with One-Time Registration, where citizens maintain reusable profile and verified credential information once, and authorized government portals can securely request only the information they need through standardized APIs and citizen consent."

## 41. Final Product Vision

OTR-India = Reusable Citizen Data + Consent + Authorization + Interoperability + Data Mapping + Verification + Auditability.

It is **not** merely an autofill extension. It is **not** merely a document storage system. It is **not** a replacement for every government database.

## 42. Final Development Rule

Every developer (and every AI working on this project) should ask before building anything:

> "Does this change help us demonstrate OTR + interoperability + secure, controlled data reuse?"

If yes, it's worth considering. If no, it's probably not a priority for the SIH prototype. Build the core end-to-end workflow first, keep the architecture consistent, keep security/privacy in mind, don't overclaim, don't over-engineer, keep the final demo reliable.

---
*OTR-India | SIH Internal Hackathon | Master Specification v1.0*
*Source: OTRINDIAMasterSpecification.pdf and OTR_Full_info_SIH.pdf, consolidated for the repository.*
