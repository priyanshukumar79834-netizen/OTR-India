const { db } = require('../utils/store');
const { generateConsentRef } = require('../utils/ids');
const { logEvent, EVENTS } = require('../utils/audit');

/**
 * Consent Management (MASTER_SPECIFICATION.md §11, §15, §41;
 * ANCHAL_DEVELOPER_INSTRUCTIONS.md §2-3, §12).
 *
 * State machine:
 *   PENDING --grant--> ACTIVE --revoke--> REVOKED
 *   PENDING --deny-->  DENIED
 *   ACTIVE  --(past expiresAt, checked lazily)--> EXPIRED
 *
 * Consent is AUTHORIZATION, not authentication — this service assumes the
 * caller has already established *who* the citizen is (Priyanshu's auth).
 */

const STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  DENIED: 'DENIED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
});

class ConsentError extends Error {
  constructor(message, code = 'CONSENT_ERROR', status = 400) {
    super(message);
    this.name = 'ConsentError';
    this.code = code;
    this.status = status;
  }
}

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days, engineering default — not in spec

/**
 * Create a consent request.
 * @param {object} params
 * @param {string} params.otrId
 * @param {string} params.requesterId - portal/application identifier (opaque, not PII)
 * @param {string} params.purpose
 * @param {string[]} params.requestedFields
 * @param {number} [params.ttlMs] - optional override of default expiry window
 */
function requestConsent({ otrId, requesterId, purpose, requestedFields, ttlMs = DEFAULT_TTL_MS }) {
  if (!otrId || !requesterId) {
    throw new ConsentError('otrId and requesterId are required', 'INVALID_REQUEST', 400);
  }
  if (!Array.isArray(requestedFields) || requestedFields.length === 0) {
    throw new ConsentError('requestedFields must be a non-empty array', 'INVALID_REQUEST', 400);
  }

  const now = new Date();
  const consent = {
    id: generateConsentRef(),
    otrId,
    requesterId,
    purpose: purpose || null,
    requestedFields: [...new Set(requestedFields)],
    approvedFields: [],
    status: STATUS.PENDING,
    createdAt: now.toISOString(),
    decidedAt: null,
    // expiresAt is only meaningful once ACTIVE; set at grant time, not request time.
    expiresAt: null,
    ttlMs,
  };

  db.consents.set(consent.id, consent);
  logEvent({
    event: EVENTS.CONSENT_REQUESTED,
    otrId,
    requestingSystem: requesterId,
    meta: { consentId: consent.id, requestedFields: consent.requestedFields },
  });
  return consent;
}

function getConsent(consentId) {
  const consent = db.consents.get(consentId);
  if (!consent) throw new ConsentError('Consent not found', 'NOT_FOUND', 404);
  return refreshExpiry(consent);
}

/** Lazily flips ACTIVE -> EXPIRED if past expiresAt. Called on every read. */
function refreshExpiry(consent) {
  if (
    consent.status === STATUS.ACTIVE &&
    consent.expiresAt &&
    new Date(consent.expiresAt).getTime() < Date.now()
  ) {
    consent.status = STATUS.EXPIRED;
    db.consents.set(consent.id, consent);
    logEvent({
      event: EVENTS.CONSENT_EXPIRED,
      otrId: consent.otrId,
      requestingSystem: consent.requesterId,
      meta: { consentId: consent.id },
    });
  }
  return consent;
}

/**
 * Grant consent. Enforces data minimization at the point of authorization:
 * approvedFields must be a subset of requestedFields (§11) — a citizen
 * cannot "grant" a field that was never requested, and the system will
 * never treat unrequested fields as shareable even if passed in error.
 */
function grantConsent(consentId, approvedFields) {
  const consent = getConsent(consentId);
  if (consent.status !== STATUS.PENDING) {
    throw new ConsentError(
      `Cannot grant consent in status ${consent.status}`,
      'INVALID_STATE',
      409
    );
  }
  if (!Array.isArray(approvedFields) || approvedFields.length === 0) {
    throw new ConsentError('approvedFields must be a non-empty array', 'INVALID_REQUEST', 400);
  }

  const requestedSet = new Set(consent.requestedFields);
  const invalid = approvedFields.filter((f) => !requestedSet.has(f));
  if (invalid.length > 0) {
    // This is the data-minimization guarantee: never approve a field beyond
    // what was actually requested, no matter what the caller sends.
    throw new ConsentError(
      `approvedFields contains fields that were never requested: ${invalid.join(', ')}`,
      'FIELD_NOT_REQUESTED',
      400
    );
  }

  const now = new Date();
  consent.approvedFields = [...new Set(approvedFields)];
  consent.status = STATUS.ACTIVE;
  consent.decidedAt = now.toISOString();
  consent.expiresAt = new Date(now.getTime() + consent.ttlMs).toISOString();
  db.consents.set(consent.id, consent);

  logEvent({
    event: EVENTS.CONSENT_GRANTED,
    otrId: consent.otrId,
    requestingSystem: consent.requesterId,
    meta: { consentId: consent.id, approvedFields: consent.approvedFields },
  });
  return consent;
}

function denyConsent(consentId) {
  const consent = getConsent(consentId);
  if (consent.status !== STATUS.PENDING) {
    throw new ConsentError(
      `Cannot deny consent in status ${consent.status}`,
      'INVALID_STATE',
      409
    );
  }
  consent.status = STATUS.DENIED;
  consent.decidedAt = new Date().toISOString();
  db.consents.set(consent.id, consent);

  logEvent({
    event: EVENTS.CONSENT_DENIED,
    otrId: consent.otrId,
    requestingSystem: consent.requesterId,
    meta: { consentId: consent.id },
  });
  return consent;
}

function revokeConsent(consentId) {
  const consent = getConsent(consentId);
  if (consent.status !== STATUS.ACTIVE) {
    throw new ConsentError(
      `Cannot revoke consent in status ${consent.status}`,
      'INVALID_STATE',
      409
    );
  }
  consent.status = STATUS.REVOKED;
  db.consents.set(consent.id, consent);

  logEvent({
    event: EVENTS.CONSENT_REVOKED,
    otrId: consent.otrId,
    requestingSystem: consent.requesterId,
    meta: { consentId: consent.id },
  });
  return consent;
}

function listConsentsForOtr(otrId) {
  return db.consents.find((c) => c.otrId === otrId).map(refreshExpiry);
}

module.exports = {
  STATUS,
  ConsentError,
  requestConsent,
  getConsent,
  grantConsent,
  denyConsent,
  revokeConsent,
  listConsentsForOtr,
};
