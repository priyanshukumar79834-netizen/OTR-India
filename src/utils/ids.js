const { v4: uuidv4 } = require('uuid');

/**
 * Identifier generation.
 *
 * Per MASTER_SPECIFICATION.md §12/§17 and ANCHAL_DEVELOPER_INSTRUCTIONS.md §11:
 * identifiers must never be derivable from Aadhaar, phone, DOB, or email.
 * All IDs here are random (uuid-based), never built from PII fields.
 */

function randomSegment(len = 6) {
  return uuidv4().replace(/-/g, '').toUpperCase().slice(0, len);
}

function generateConsentRef() {
  return `CONSENT-${randomSegment(8)}`;
}

function generateCredentialId() {
  return `CRED-${randomSegment(8)}`;
}

/**
 * Application Reference ID: APP-<PORTAL>-<YEAR>-XXXX (§12, §18).
 * portalId is an opaque portal/application identifier (e.g. "SSC"), never PII.
 */
function generateApplicationId(portalId, year = new Date().getFullYear()) {
  const safePortal = String(portalId || 'PORTAL')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12) || 'PORTAL';
  return `APP-${safePortal}-${year}-${randomSegment(4)}`;
}

function generateId(prefix = 'ID') {
  return `${prefix}-${randomSegment(8)}`;
}

module.exports = {
  generateConsentRef,
  generateCredentialId,
  generateApplicationId,
  generateId,
};
