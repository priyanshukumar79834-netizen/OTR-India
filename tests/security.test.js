const { resetAll } = require('../src/utils/store');
const consentService = require('../src/services/consentService');
const authorizationService = require('../src/services/authorizationService');
const applicationService = require('../src/services/applicationService');

beforeEach(() => resetAll());

const FULL_PROFILE = {
  name: 'Priyanshu Demo',
  mobile: '9000000000',
  casteCertificate: 'CERT-DEMO-001',
};

describe('Security: unauthorized access / invalid or missing consent', () => {
  test('access attempted without any consent record ("invalid token" scenario) is denied, not crashed', () => {
    const result = authorizationService.getAuthorizedFields({
      consentId: 'CONSENT-FORGED0001',
      fullProfileData: FULL_PROFILE,
    });
    expect(result.authorized).toBe(false);
    expect(result.fields).toEqual({});
  });

  test('a PENDING consent (not yet granted) authorizes nothing', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name'],
    });
    const result = authorizationService.getAuthorizedFields({ consentId: consent.id, fullProfileData: FULL_PROFILE });
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('CONSENT_PENDING');
  });

  test('application creation is blocked without a valid ACTIVE consent when one is supplied', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name'],
    });
    consentService.denyConsent(consent.id);

    expect(() =>
      applicationService.createApplication({ otrId: 'OTR-IND-DEMO001', portalId: 'SSC', consentId: consent.id })
    ).toThrow();
  });

  test('sensitive document content is never stored in credential metadata (only a reference/pointer)', () => {
    // documentRef must be a pointer, never raw bytes — this test asserts the
    // metadata shape doesn't carry a binary/content field at all.
    const credentialService = require('../src/services/credentialService');
    const credential = credentialService.submitCredential({
      otrId: 'OTR-IND-DEMO001',
      type: '10th_marksheet',
      documentRef: 'object-storage://bucket/demo-key-001',
    });
    expect(Object.keys(credential)).not.toContain('fileContent');
    expect(Object.keys(credential)).not.toContain('binaryData');
    expect(credential.documentRef).toMatch(/^object-storage:\/\//);
  });

  test('audit log never stores raw approved field VALUES, only field names', () => {
    const { db } = require('../src/utils/store');
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name', 'mobile'],
    });
    consentService.grantConsent(consent.id, ['name']);

    authorizationService.getAuthorizedFields({ consentId: consent.id, fullProfileData: FULL_PROFILE });

    const logs = db.auditLogs.getAll();
    const serialized = JSON.stringify(logs);
    // The actual PII value should never appear in audit logs, only field names/ids.
    expect(serialized).not.toMatch(FULL_PROFILE.name);
    expect(serialized).not.toMatch(FULL_PROFILE.mobile);
  });
});
