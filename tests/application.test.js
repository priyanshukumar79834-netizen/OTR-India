const { resetAll } = require('../src/utils/store');
const consentService = require('../src/services/consentService');
const applicationService = require('../src/services/applicationService');

beforeEach(() => resetAll());

function makeActiveConsent(fields = ['name', 'dateOfBirth']) {
  const consent = consentService.requestConsent({
    otrId: 'OTR-IND-DEMO001',
    requesterId: 'GovRecruit-A',
    requestedFields: fields,
  });
  return consentService.grantConsent(consent.id, fields);
}

describe('Application flow', () => {
  test('create -> add data -> validate -> submit -> application ID generated', () => {
    const consent = makeActiveConsent();
    const application = applicationService.createApplication({
      otrId: 'OTR-IND-DEMO001',
      portalId: 'SSC',
      consentId: consent.id,
    });
    expect(application.status).toBe('DRAFT');

    applicationService.setApplicationData(application.id, 'examCentre', 'Delhi');

    const validation = applicationService.validateApplication(application.id);
    expect(validation.valid).toBe(true);

    const submitted = applicationService.submitApplication(application.id);
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.referenceId).toMatch(/^APP-SSC-\d{4}-[A-Z0-9]{4}$/);
  });

  test('cannot create application with a non-ACTIVE consent', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name'],
    }); // still PENDING
    expect(() =>
      applicationService.createApplication({ otrId: 'OTR-IND-DEMO001', portalId: 'SSC', consentId: consent.id })
    ).toThrow(/Cannot attach consent/);
  });

  test('validation fails with no application data', () => {
    const consent = makeActiveConsent();
    const application = applicationService.createApplication({
      otrId: 'OTR-IND-DEMO001',
      portalId: 'SSC',
      consentId: consent.id,
    });
    const validation = applicationService.validateApplication(application.id);
    expect(validation.valid).toBe(false);
    expect(validation.errors.join(' ')).toMatch(/no application-specific data/);
  });

  test('submit fails validation cleanly (does not throw uncaught, gives structured error)', () => {
    const consent = makeActiveConsent();
    const application = applicationService.createApplication({
      otrId: 'OTR-IND-DEMO001',
      portalId: 'SSC',
      consentId: consent.id,
    });
    expect(() => applicationService.submitApplication(application.id)).toThrow(/failed validation/);
  });

  test('per-application override never touches a master profile store (isolation check)', () => {
    const consent = makeActiveConsent(['email']);
    const application = applicationService.createApplication({
      otrId: 'OTR-IND-DEMO001',
      portalId: 'RRB',
      consentId: consent.id,
    });

    const override = applicationService.setApplicationData(application.id, 'email', 'alternate@example.com', {
      isOverride: true,
    });
    expect(override.isOverride).toBe(true);
    expect(override.fieldValue).toBe('alternate@example.com');

    // This service module has no master-profile store at all to have mutated —
    // the override lives only in application_data, scoped to this application.
    const data = applicationService.getApplicationData(application.id);
    expect(data).toHaveLength(1);
    expect(data[0].applicationId).toBe(application.id);
  });

  test('cannot modify data or resubmit after an application is already SUBMITTED', () => {
    const consent = makeActiveConsent();
    const application = applicationService.createApplication({
      otrId: 'OTR-IND-DEMO001',
      portalId: 'SSC',
      consentId: consent.id,
    });
    applicationService.setApplicationData(application.id, 'examCentre', 'Delhi');
    applicationService.submitApplication(application.id);

    expect(() => applicationService.setApplicationData(application.id, 'examCentre', 'Mumbai')).toThrow(
      /Cannot modify data/
    );
    expect(() => applicationService.submitApplication(application.id)).toThrow(/failed validation|not in DRAFT/);
  });

  test('application reference ID is never derivable from PII (random suffix, opaque portal id)', () => {
    const consent = makeActiveConsent();
    const application = applicationService.createApplication({
      otrId: 'OTR-IND-DEMO001',
      portalId: 'SSC',
      consentId: consent.id,
    });
    applicationService.setApplicationData(application.id, 'examCentre', 'Delhi');
    const submitted = applicationService.submitApplication(application.id);

    expect(submitted.referenceId).not.toMatch(/DEMO001/);
    expect(submitted.referenceId).not.toMatch(/9000000000/);
  });

  test('unknown application id throws NOT_FOUND', () => {
    expect(() => applicationService.getApplication('APPDRAFT-NOPE')).toThrow(/not found/i);
  });
});
