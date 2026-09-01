const request = require('supertest');
const { createApp } = require('../src/app');
const { resetAll } = require('../src/utils/store');

beforeEach(() => resetAll());

const app = createApp();

describe('API smoke test — full happy path over HTTP', () => {
  test('consent -> credential -> application end-to-end', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);

    const consentRes = await request(app).post('/api/consent/request').send({
      otrId: 'OTR-IND-DEMO001',
      requesterId: 'GovRecruit-A',
      purpose: 'Recruitment application',
      requestedFields: ['name', 'dateOfBirth', 'category'],
    });
    expect(consentRes.status).toBe(201);
    const consentId = consentRes.body.data.id;

    const grantRes = await request(app)
      .post(`/api/consent/${consentId}/grant`)
      .send({ approvedFields: ['name', 'dateOfBirth'] });
    expect(grantRes.status).toBe(200);
    expect(grantRes.body.data.status).toBe('ACTIVE');

    const authCheck = await request(app)
      .post('/api/authorization/check')
      .send({ consentId, field: 'category' });
    expect(authCheck.body.data.authorized).toBe(false); // requested but not approved

    const credRes = await request(app).post('/api/credentials').send({
      otrId: 'OTR-IND-DEMO001',
      type: '10th_marksheet',
      reference: 'CERT-DEMO-001',
    });
    expect(credRes.status).toBe(201);
    expect(credRes.body.data.verificationStatus).toBe('USER_PROVIDED');

    const credentialId = credRes.body.data.id;
    await request(app).post(`/api/credentials/${credentialId}/request-verification`);
    const verifyRes = await request(app).post(`/api/credentials/${credentialId}/verify`);
    expect(verifyRes.body.data.verificationStatus).toBe('VERIFIED');

    const appRes = await request(app).post('/api/applications').send({
      otrId: 'OTR-IND-DEMO001',
      portalId: 'SSC',
      consentId,
    });
    expect(appRes.status).toBe(201);
    const applicationId = appRes.body.data.id;

    await request(app)
      .post(`/api/applications/${applicationId}/data`)
      .send({ fieldName: 'examCentre', fieldValue: 'Delhi' });

    const submitRes = await request(app).post(`/api/applications/${applicationId}/submit`);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe('SUBMITTED');
    expect(submitRes.body.data.referenceId).toMatch(/^APP-SSC-\d{4}-/);
  });

  test('errors are shaped consistently and never leak internals', async () => {
    const res = await request(app).get('/api/consent/CONSENT-NOPE');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
