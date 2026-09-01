const { resetAll } = require('../src/utils/store');
const credentialService = require('../src/services/credentialService');

beforeEach(() => resetAll());

describe('Credential metadata & verification lifecycle', () => {
  test('upload never implies verified', () => {
    const credential = credentialService.submitCredential({
      otrId: 'OTR-IND-DEMO001',
      type: '10th_marksheet',
      reference: 'CERT-DEMO-001',
    });
    expect(credential.verificationStatus).toBe('USER_PROVIDED');
    expect(credential.issuer).toBeNull();
  });

  test('full happy path: USER_PROVIDED -> PENDING_VERIFICATION -> VERIFIED', () => {
    const credential = credentialService.submitCredential({
      otrId: 'OTR-IND-DEMO001',
      type: '10th_marksheet',
      reference: 'CERT-DEMO-001',
    });
    credentialService.requestVerification(credential.id);
    const verified = credentialService.runMockVerification(credential.id);
    expect(verified.verificationStatus).toBe('VERIFIED');
    expect(verified.issuer).toMatch(/Mock/i);
  });

  test('mock issuer rejects an invalid reference', () => {
    const credential = credentialService.submitCredential({
      otrId: 'OTR-IND-DEMO001',
      type: 'caste_certificate',
      reference: 'INVALID',
    });
    credentialService.requestVerification(credential.id);
    const result = credentialService.runMockVerification(credential.id);
    expect(result.verificationStatus).toBe('REJECTED');
  });

  test('rejected credential can be resubmitted for verification', () => {
    const credential = credentialService.submitCredential({
      otrId: 'OTR-IND-DEMO001',
      type: 'caste_certificate',
      reference: 'INVALID',
    });
    credentialService.requestVerification(credential.id);
    credentialService.runMockVerification(credential.id); // -> REJECTED
    const resubmitted = credentialService.requestVerification(credential.id);
    expect(resubmitted.verificationStatus).toBe('PENDING_VERIFICATION');
  });

  test('cannot verify a credential that is not PENDING_VERIFICATION', () => {
    const credential = credentialService.submitCredential({
      otrId: 'OTR-IND-DEMO001',
      type: '10th_marksheet',
      reference: 'CERT-DEMO-001',
    });
    expect(() => credentialService.runMockVerification(credential.id)).toThrow(/must be PENDING_VERIFICATION/);
  });

  test('illegal transitions are rejected (e.g. VERIFIED -> PENDING_VERIFICATION)', () => {
    const credential = credentialService.submitCredential({
      otrId: 'OTR-IND-DEMO001',
      type: '10th_marksheet',
      reference: 'CERT-DEMO-001',
    });
    credentialService.requestVerification(credential.id);
    credentialService.runMockVerification(credential.id); // VERIFIED
    expect(() => credentialService.requestVerification(credential.id)).toThrow(/Illegal transition/);
  });

  test('revoke and expire transitions', () => {
    const c1 = credentialService.submitCredential({ otrId: 'OTR-IND-DEMO001', type: '10th_marksheet' });
    const revoked = credentialService.revokeCredential(c1.id);
    expect(revoked.verificationStatus).toBe('REVOKED');

    const c2 = credentialService.submitCredential({ otrId: 'OTR-IND-DEMO001', type: '12th_marksheet', reference: 'CERT-2' });
    credentialService.requestVerification(c2.id);
    credentialService.runMockVerification(c2.id);
    const expired = credentialService.expireCredential(c2.id);
    expect(expired.verificationStatus).toBe('EXPIRED');
  });
});
