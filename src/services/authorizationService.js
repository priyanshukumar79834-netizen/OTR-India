const { getConsent, STATUS, ConsentError } = require('./consentService');
const { logEvent, EVENTS } = require('../utils/audit');

/**
 * Data Minimization Enforcement (MASTER_SPECIFICATION.md §11;
 * ANCHAL_DEVELOPER_INSTRUCTIONS.md §3, §7, §11).
 *
 * This is the single "is field X shareable for this request" check that
 * Harsh's connectors are expected to call before returning ANY field to a
 * portal (per ANCHAL_DEVELOPER_INSTRUCTIONS.md §6). Harsh's connectors
 * should not reimplement this logic — they should call it.
 *
 * The rule: a field is authorized only if the associated consent is
 * ACTIVE (not pending/denied/revoked/expired) AND the field is in that
 * consent's approvedFields.
 */

/**
 * @param {object} params
 * @param {string} params.consentId
 * @param {string} params.field
 * @returns {boolean}
 */
function isFieldAuthorized({ consentId, field }) {
  let consent;
  try {
    consent = getConsent(consentId);
  } catch (err) {
    if (err instanceof ConsentError) return false;
    throw err;
  }
  return consent.status === STATUS.ACTIVE && consent.approvedFields.includes(field);
}

/**
 * Filters an arbitrary profile-shaped object down to only the fields
 * authorized by an ACTIVE consent. Never returns more than approvedFields,
 * regardless of what's present in fullProfileData. This is the function
 * that stands between "the whole OTR profile" and "what a portal gets".
 *
 * @param {object} params
 * @param {string} params.consentId
 * @param {object} params.fullProfileData - flat { fieldName: value } map
 * @param {string} [params.requestingSystem]
 */
function getAuthorizedFields({ consentId, fullProfileData, requestingSystem }) {
  let consent;
  try {
    consent = getConsent(consentId);
  } catch (err) {
    if (err instanceof ConsentError) {
      logEvent({
        event: EVENTS.DATA_ACCESS_DENIED,
        otrId: null,
        requestingSystem,
        result: 'FAILURE',
        meta: { consentId, reason: err.code },
      });
      return { authorized: false, reason: err.code, fields: {} };
    }
    throw err;
  }

  if (consent.status !== STATUS.ACTIVE) {
    logEvent({
      event: EVENTS.DATA_ACCESS_DENIED,
      otrId: consent.otrId,
      requestingSystem: requestingSystem || consent.requesterId,
      result: 'FAILURE',
      meta: { consentId, reason: `CONSENT_${consent.status}` },
    });
    return { authorized: false, reason: `CONSENT_${consent.status}`, fields: {} };
  }

  const fields = {};
  for (const field of consent.approvedFields) {
    if (Object.prototype.hasOwnProperty.call(fullProfileData || {}, field)) {
      fields[field] = fullProfileData[field];
    }
    // Fields approved but absent from the profile are silently omitted,
    // not fabricated — the caller can inspect approvedFields vs fields
    // returned if it needs to know about that gap.
  }

  logEvent({
    event: EVENTS.DATA_ACCESSED,
    otrId: consent.otrId,
    requestingSystem: requestingSystem || consent.requesterId,
    result: 'SUCCESS',
    meta: { consentId, fieldsReturned: Object.keys(fields) },
  });

  return { authorized: true, reason: null, fields };
}

module.exports = { isFieldAuthorized, getAuthorizedFields };
