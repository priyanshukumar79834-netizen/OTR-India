const { resetAll } = require('../src/utils/store');
const consentService = require('../src/services/consentService');
const authorizationService = require('../src/services/authorizationService');

beforeEach(() => resetAll());

const FULL_PROFILE = {
  name: 'Priyanshu Demo',
  dateOfBirth: '2005-01-01',
  category: 'General',
  mobile: '9000000000',
  email: 'demo@example.com',
  casteCertificate: 'CERT-DEMO-001',
};

describe('Data minimization enforcement', () => {
  test('approved fields are returned, unapproved fields are not', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name', 'dateOfBirth', 'category', 'mobile', 'email', 'casteCertificate'],
    });
    consentService.grantConsent(consent.id, ['name', 'dateOfBirth', 'category']);

    const result = authorizationService.getAuthorizedFields({
      consentId: consent.id,
      fullProfileData: FULL_PROFILE,
      requestingSystem: 'GovRecruit-A',
    });

    expect(result.authorized).toBe(true);
    expect(Object.keys(result.fields).sort()).toEqual(['category', 'dateOfBirth', 'name']);
    expect(result.fields.mobile).toBeUndefined();
    expect(result.fields.email).toBeUndefined();
    expect(result.fields.casteCertificate).toBeUndefined();
  });

  test('full profile is never returned even if requested/approved fields are a large subset', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name', 'mobile'],
    });
    consentService.grantConsent(consent.id, ['name', 'mobile']);

    const result = authorizationService.getAuthorizedFields({
      consentId: consent.id,
      fullProfileData: FULL_PROFILE,
    });
    expect(Object.keys(result.fields).sort()).toEqual(['mobile', 'name']);
    expect(Object.keys(result.fields).length).toBeLessThan(Object.keys(FULL_PROFILE).length);
  });

  test('denied consent yields no fields', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name'],
    });
    consentService.denyConsent(consent.id);

    const result = authorizationService.getAuthorizedFields({ consentId: consent.id, fullProfileData: FULL_PROFILE });
    expect(result.authorized).toBe(false);
    expect(result.fields).toEqual({});
  });

  test('revoked consent yields no fields even if previously active', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name'],
    });
    consentService.grantConsent(consent.id, ['name']);
    consentService.revokeConsent(consent.id);

    const result = authorizationService.getAuthorizedFields({ consentId: consent.id, fullProfileData: FULL_PROFILE });
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('CONSENT_REVOKED');
  });

  test('unknown consent id is safely denied, not a crash', () => {
    const result = authorizationService.getAuthorizedFields({
      consentId: 'CONSENT-NOPE',
      fullProfileData: FULL_PROFILE,
    });
    expect(result.authorized).toBe(false);
  });

  test('isFieldAuthorized single-field check matches getAuthorizedFields', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name', 'mobile'],
    });
    consentService.grantConsent(consent.id, ['name']);

    expect(authorizationService.isFieldAuthorized({ consentId: consent.id, field: 'name' })).toBe(true);
    expect(authorizationService.isFieldAuthorized({ consentId: consent.id, field: 'mobile' })).toBe(false);
  });
});
