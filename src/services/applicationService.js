const { db } = require('../utils/store');
const { generateApplicationId, generateId } = require('../utils/ids');
const { logEvent, EVENTS } = require('../utils/audit');
const { getConsent, STATUS: CONSENT_STATUS } = require('./consentService');

/**
 * Application Flow (MASTER_SPECIFICATION.md §12-13, §18;
 * ANCHAL_DEVELOPER_INSTRUCTIONS.md §2-3).
 *
 * Covers: application creation, attaching OTR + consent, application-specific
 * data / per-application overrides (never mutating the master profile),
 * submission recording, and application reference ID generation.
 *
 * A token is not proof of submission (§12) — submission is its own recorded
 * event here, independent of whatever retrieval token a portal used.
 *
 * NOTE ON PROFILE VERSIONING: the spec (per the developer's own brief)
 * calls for preserving the OTR profile version used at submission time.
 * That depends on Priyanshu's profile-versioning implementation, which
 * doesn't exist yet. `profileVersionRef` is included as a field/placeholder
 * so the shape is ready, but it is NOT enforced or populated here — that's
 * flagged as a dependency, not silently faked.
 */

class ApplicationError extends Error {
  constructor(message, code = 'APPLICATION_ERROR', status = 400) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.status = status;
  }
}

const APP_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  FAILED: 'FAILED',
});

/**
 * Create a draft application, attaching an OTR ID, a portal identifier, and
 * (optionally) an existing consent. If a consentId is provided it must
 * currently be ACTIVE — an application should not be built on top of
 * denied/revoked/expired consent.
 */
function createApplication({ otrId, portalId, consentId = null, profileVersionRef = null }) {
  if (!otrId || !portalId) {
    throw new ApplicationError('otrId and portalId are required', 'INVALID_REQUEST', 400);
  }

  if (consentId) {
    const consent = getConsent(consentId); // throws NOT_FOUND if missing
    if (consent.status !== CONSENT_STATUS.ACTIVE) {
      throw new ApplicationError(
        `Cannot attach consent in status ${consent.status} to an application`,
        'INVALID_CONSENT_STATE',
        409
      );
    }
  }

  const application = {
    id: generateId('APPDRAFT'), // internal draft id; the public APP-... id is assigned at submission
    otrId,
    portalId,
    consentId,
    profileVersionRef, // see note above — not enforced yet, pending Priyanshu
    status: APP_STATUS.DRAFT,
    referenceId: null, // populated on submit
    createdAt: new Date().toISOString(),
    submittedAt: null,
  };
  db.applications.set(application.id, application);

  logEvent({
    event: EVENTS.APPLICATION_CREATED,
    otrId,
    requestingSystem: portalId,
    meta: { applicationId: application.id, consentId },
  });
  return application;
}

function getApplication(applicationId) {
  const application = db.applications.get(applicationId);
  if (!application) throw new ApplicationError('Application not found', 'NOT_FOUND', 404);
  return application;
}

/**
 * Set an application-specific field. If `isOverride` is true, this value is
 * scoped ONLY to this application and never written back to any master OTR
 * profile record (MASTER_SPECIFICATION.md §13). This service has no access
 * to and never touches Priyanshu's master profile store — overrides live
 * entirely in application_data, referencing the application, not mutating
 * anything upstream.
 */
function setApplicationData(applicationId, fieldName, fieldValue, { isOverride = false } = {}) {
  const application = getApplication(applicationId);
  if (application.status !== APP_STATUS.DRAFT) {
    throw new ApplicationError(
      `Cannot modify data on a ${application.status} application`,
      'INVALID_STATE',
      409
    );
  }
  if (!fieldName) {
    throw new ApplicationError('fieldName is required', 'INVALID_REQUEST', 400);
  }

  const existing = db.applicationData.findOne(
    (d) => d.applicationId === applicationId && d.fieldName === fieldName
  );

  const record = existing || {
    id: generateId('APPDATA'),
    applicationId,
    fieldName,
  };
  record.fieldValue = fieldValue;
  record.isOverride = Boolean(isOverride);
  record.updatedAt = new Date().toISOString();
  db.applicationData.set(record.id, record);
  return record;
}

function getApplicationData(applicationId) {
  return db.applicationData.find((d) => d.applicationId === applicationId);
}

/**
 * Validate an application is ready to submit. Minimal prototype rule: must
 * have an ACTIVE consent attached if any data-sharing is implied, and must
 * have at least one piece of application data. Extend as real portal
 * requirements (from Harsh) become known.
 */
function validateApplication(applicationId) {
  const application = getApplication(applicationId);
  const errors = [];

  if (application.status !== APP_STATUS.DRAFT) {
    errors.push(`Application is not in DRAFT status (currently ${application.status})`);
  }
  if (application.consentId) {
    try {
      const consent = getConsent(application.consentId);
      if (consent.status !== CONSENT_STATUS.ACTIVE) {
        errors.push(`Attached consent is not ACTIVE (status: ${consent.status})`);
      }
    } catch (err) {
      errors.push('Attached consent could not be found');
    }
  }
  const data = getApplicationData(applicationId);
  if (data.length === 0) {
    errors.push('Application has no application-specific data recorded');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Submit the application: validates, generates the public application
 * reference ID (APP-<PORTAL>-<YEAR>-XXXX), and records submission. This
 * recording is independent of any retrieval token — the token proved data
 * could be fetched, not that a submission happened (§12).
 */
function submitApplication(applicationId) {
  const application = getApplication(applicationId);
  const { valid, errors } = validateApplication(applicationId);
  if (!valid) {
    throw new ApplicationError(`Application failed validation: ${errors.join('; ')}`, 'VALIDATION_FAILED', 422);
  }

  application.referenceId = generateApplicationId(application.portalId);
  application.status = APP_STATUS.SUBMITTED;
  application.submittedAt = new Date().toISOString();
  db.applications.set(application.id, application);

  logEvent({
    event: EVENTS.APPLICATION_SUBMITTED,
    otrId: application.otrId,
    requestingSystem: application.portalId,
    meta: { applicationId: application.id, referenceId: application.referenceId },
  });
  return application;
}

function listApplicationsForOtr(otrId) {
  return db.applications.find((a) => a.otrId === otrId);
}

module.exports = {
  APP_STATUS,
  ApplicationError,
  createApplication,
  getApplication,
  setApplicationData,
  getApplicationData,
  validateApplication,
  submitApplication,
  listApplicationsForOtr,
};
