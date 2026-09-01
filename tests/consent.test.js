const { resetAll } = require('../src/utils/store');
const consentService = require('../src/services/consentService');

beforeEach(() => resetAll());

describe('Consent management', () => {
  test('create -> grant happy path', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      purpose: 'Recruitment application',
      requestedFields: ['name', 'dateOfBirth', 'category'],
    });
    expect(consent.status).toBe('PENDING');

    const granted = consentService.grantConsent(consent.id, ['name', 'dateOfBirth']);
    expect(granted.status).toBe('ACTIVE');
    expect(granted.approvedFields).toEqual(['name', 'dateOfBirth']);
    expect(granted.expiresAt).not.toBeNull();
  });

  test('deny sets DENIED and blocks further grant', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name'],
    });
    const denied = consentService.denyConsent(consent.id);
    expect(denied.status).toBe('DENIED');
    expect(() => consentService.grantConsent(consent.id, ['name'])).toThrow();
  });

  test('cannot grant fields that were never requested (data minimization at authorization point)', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name', 'dateOfBirth'],
    });
    expect(() => consentService.grantConsent(consent.id, ['name', 'phone'])).toThrow(/never requested/);
  });

  test('expired consent is lazily flipped to EXPIRED on read', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name'],
      ttlMs: 1, // expires almost immediately
    });
    consentService.grantConsent(consent.id, ['name']);

    return new Promise((resolve) => {
      setTimeout(() => {
        const fetched = consentService.getConsent(consent.id);
        expect(fetched.status).toBe('EXPIRED');
        resolve();
      }, 20);
    });
  });

  test('revoke only works from ACTIVE', () => {
    const consent = consentService.requestConsent({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      requestedFields: ['name'],
    });
    expect(() => consentService.revokeConsent(consent.id)).toThrow(); // still PENDING
    consentService.grantConsent(consent.id, ['name']);
    const revoked = consentService.revokeConsent(consent.id);
    expect(revoked.status).toBe('REVOKED');
  });

  test('invalid/unknown consent id throws NOT_FOUND', () => {
    expect(() => consentService.getConsent('CONSENT-DOESNOTEXIST')).toThrow(/not found/i);
  });

  test('unauthorized requester scenario: no consent exists for a requester -> nothing accessible', () => {
    const consents = consentService.listConsentsForOtr('OTR-IND-DEMO001');
    expect(consents).toEqual([]);
  });
});
