const { db } = require('../utils/store');
const { generateCredentialId } = require('../utils/ids');
const { logEvent, EVENTS } = require('../utils/audit');
const mockIssuer = require('./mockIssuer');

/**
 * Credential / Document Metadata (MASTER_SPECIFICATION.md §5-6, §14, §23;
 * ANCHAL_DEVELOPER_INSTRUCTIONS.md §2-3, §26).
 *
 * IMPORTANT: this stores METADATA only (id, type, issuer, verificationStatus,
 * issueDate, expiry, reference, documentRef). The actual file/binary is
 * assumed to live in object storage elsewhere (§14) — documentRef here is
 * just a pointer/placeholder, never the file content itself.
 *
 * Status lifecycle: USER_PROVIDED -> PENDING_VERIFICATION -> VERIFIED
 *                                                          -> REJECTED
 *                    (any of the above) -> EXPIRED / REVOKED
 *
 * Uploading a document NEVER implies VERIFIED — that only happens through
 * an explicit (mocked) verification step.
 */

const VERIFICATION_STATUS = Object.freeze({
  USER_PROVIDED: 'USER_PROVIDED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
});

class CredentialError extends Error {
  constructor(message, code = 'CREDENTIAL_ERROR', status = 400) {
    super(message);
    this.name = 'CredentialError';
    this.code = code;
    this.status = status;
  }
}

/** Legal forward transitions. Anything not listed here is rejected. */
const ALLOWED_TRANSITIONS = {
  [VERIFICATION_STATUS.USER_PROVIDED]: [VERIFICATION_STATUS.PENDING_VERIFICATION, VERIFICATION_STATUS.REVOKED],
  [VERIFICATION_STATUS.PENDING_VERIFICATION]: [
    VERIFICATION_STATUS.VERIFIED,
    VERIFICATION_STATUS.REJECTED,
    VERIFICATION_STATUS.REVOKED,
  ],
  [VERIFICATION_STATUS.VERIFIED]: [VERIFICATION_STATUS.EXPIRED, VERIFICATION_STATUS.REVOKED],
  [VERIFICATION_STATUS.REJECTED]: [VERIFICATION_STATUS.PENDING_VERIFICATION], // allow re-submission
  [VERIFICATION_STATUS.EXPIRED]: [],
  [VERIFICATION_STATUS.REVOKED]: [],
};

function submitCredential({ otrId, type, reference = null, issueDate = null, expiry = null, documentRef = null }) {
  if (!otrId || !type) {
    throw new CredentialError('otrId and type are required', 'INVALID_REQUEST', 400);
  }
  const credential = {
    id: generateCredentialId(),
    otrId,
    type,
    issuer: null, // not set until verification is attempted
    verificationStatus: VERIFICATION_STATUS.USER_PROVIDED,
    issueDate,
    expiry,
    reference,
    documentRef, // pointer only — never the binary itself
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.credentials.set(credential.id, credential);

  logEvent({
    event: EVENTS.CREDENTIAL_SUBMITTED,
    otrId,
    meta: { credentialId: credential.id, type },
  });
  return credential;
}

function getCredential(credentialId) {
  const credential = db.credentials.get(credentialId);
  if (!credential) throw new CredentialError('Credential not found', 'NOT_FOUND', 404);
  return credential;
}

function listCredentialsForOtr(otrId) {
  return db.credentials.find((c) => c.otrId === otrId);
}

function transition(credential, nextStatus) {
  const allowed = ALLOWED_TRANSITIONS[credential.verificationStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new CredentialError(
      `Illegal transition ${credential.verificationStatus} -> ${nextStatus}`,
      'INVALID_TRANSITION',
      409
    );
  }
  credential.verificationStatus = nextStatus;
  credential.updatedAt = new Date().toISOString();
  db.credentials.set(credential.id, credential);
  return credential;
}

/** Move USER_PROVIDED -> PENDING_VERIFICATION (queued for the mock issuer). */
function requestVerification(credentialId) {
  const credential = getCredential(credentialId);
  return transition(credential, VERIFICATION_STATUS.PENDING_VERIFICATION);
}

/**
 * Run the (mock) issuer check and apply VERIFIED/REJECTED. This is the only
 * path by which a credential can become VERIFIED — never a side effect of
 * upload or of any other action.
 */
function runMockVerification(credentialId) {
  const credential = getCredential(credentialId);
  if (credential.verificationStatus !== VERIFICATION_STATUS.PENDING_VERIFICATION) {
    throw new CredentialError(
      `Credential must be PENDING_VERIFICATION to verify, is ${credential.verificationStatus}`,
      'INVALID_STATE',
      409
    );
  }
  const result = mockIssuer.evaluate(credential);
  credential.issuer = result.issuer;
  transition(credential, result.outcome);

  logEvent({
    event: result.outcome === VERIFICATION_STATUS.VERIFIED ? EVENTS.CREDENTIAL_VERIFIED : EVENTS.CREDENTIAL_REJECTED,
    otrId: credential.otrId,
    requestingSystem: result.issuer,
    meta: { credentialId: credential.id, outcome: result.outcome },
  });
  return credential;
}

function revokeCredential(credentialId) {
  const credential = getCredential(credentialId);
  return transition(credential, VERIFICATION_STATUS.REVOKED);
}

function expireCredential(credentialId) {
  const credential = getCredential(credentialId);
  return transition(credential, VERIFICATION_STATUS.EXPIRED);
}

module.exports = {
  VERIFICATION_STATUS,
  CredentialError,
  submitCredential,
  getCredential,
  listCredentialsForOtr,
  requestVerification,
  runMockVerification,
  revokeCredential,
  expireCredential,
};
