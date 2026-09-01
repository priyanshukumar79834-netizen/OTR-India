const express = require('express');

const consentRoutes = require('./routes/consentRoutes');
const credentialRoutes = require('./routes/credentialRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const authorizationService = require('./services/authorizationService');
const { ok, asyncHandler } = require('./utils/respond');

/**
 * OTR-India — Anchal's module (Consent + Document/Data Management +
 * Application Flow), standalone Express app.
 *
 * This is intentionally a self-contained app (not yet mounted into
 * Priyanshu's foundation) so it can be run/tested independently. When the
 * shared backend exists, these routers are designed to be mounted under
 * app.use('/api/consent', consentRoutes) etc. inside the main app rather
 * than requiring a rewrite.
 */

function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => ok(res, { status: 'ok', module: 'anchal-consent-document-application' }));

  app.use('/api/consent', consentRoutes);
  app.use('/api/credentials', credentialRoutes);
  app.use('/api/applications', applicationRoutes);

  // The authorization check other modules (Harsh's connectors) are meant to
  // call before releasing any field to a portal. Exposed as a small
  // standalone endpoint per ANCHAL_DEVELOPER_INSTRUCTIONS.md §8/§10.
  app.post(
    '/api/authorization/check',
    asyncHandler(async (req, res) => {
      const { consentId, field } = req.body;
      const authorized = authorizationService.isFieldAuthorized({ consentId, field });
      ok(res, { authorized });
    })
  );

  app.post(
    '/api/authorization/fields',
    asyncHandler(async (req, res) => {
      const { consentId, fullProfileData, requestingSystem } = req.body;
      const result = authorizationService.getAuthorizedFields({ consentId, fullProfileData, requestingSystem });
      ok(res, result);
    })
  );

  // 404 fallback
  app.use((req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  return app;
}

module.exports = { createApp };
