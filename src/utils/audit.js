const { db } = require('./store');
const { generateId } = require('./ids');

/**
 * Audit logging (MASTER_SPECIFICATION.md §24, §41; ANCHAL_DEVELOPER_INSTRUCTIONS.md §11).
 *
 * Logs WHAT happened, not sensitive contents: no raw document bytes, no full
 * field values beyond field *names*, no secrets. Each record captures
 * event/user-or-otr-reference/requesting-system/timestamp/result, matching
 * the event vocabulary in §24 (CONSENT_REQUESTED, CONSENT_GRANTED, ...).
 */

const EVENTS = Object.freeze({
  CONSENT_REQUESTED: 'CONSENT_REQUESTED',
  CONSENT_GRANTED: 'CONSENT_GRANTED',
  CONSENT_DENIED: 'CONSENT_DENIED',
  CONSENT_REVOKED: 'CONSENT_REVOKED',
  CONSENT_EXPIRED: 'CONSENT_EXPIRED',
  DATA_ACCESSED: 'DATA_ACCESSED',
  DATA_ACCESS_DENIED: 'DATA_ACCESS_DENIED',
  DOCUMENT_ACCESSED: 'DOCUMENT_ACCESSED',
  CREDENTIAL_SUBMITTED: 'CREDENTIAL_SUBMITTED',
  CREDENTIAL_VERIFIED: 'CREDENTIAL_VERIFIED',
  CREDENTIAL_REJECTED: 'CREDENTIAL_REJECTED',
  APPLICATION_CREATED: 'APPLICATION_CREATED',
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
});

function logEvent({ event, otrId, requestingSystem = null, result = 'SUCCESS', meta = {} }) {
  const record = {
    id: generateId('AUDIT'),
    event,
    otrId,
    requestingSystem,
    result,
    // meta must only ever hold non-sensitive descriptors (field NAMES, counts,
    // statuses) — never field values, document contents, or secrets.
    meta,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.set(record.id, record);
  return record;
}

module.exports = { EVENTS, logEvent };
