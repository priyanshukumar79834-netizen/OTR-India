const consentService = require('../services/consentService');
const { ok, asyncHandler } = require('../utils/respond');

const requestConsent = asyncHandler(async (req, res) => {
  const { otrId, requesterId, purpose, requestedFields, ttlMs } = req.body;
  const consent = consentService.requestConsent({ otrId, requesterId, purpose, requestedFields, ttlMs });
  ok(res, consent, 201);
});

const grantConsent = asyncHandler(async (req, res) => {
  const { approvedFields } = req.body;
  const consent = consentService.grantConsent(req.params.id, approvedFields);
  ok(res, consent);
});

const denyConsent = asyncHandler(async (req, res) => {
  const consent = consentService.denyConsent(req.params.id);
  ok(res, consent);
});

const revokeConsent = asyncHandler(async (req, res) => {
  const consent = consentService.revokeConsent(req.params.id);
  ok(res, consent);
});

const getConsent = asyncHandler(async (req, res) => {
  const consent = consentService.getConsent(req.params.id);
  ok(res, consent);
});

const listConsentsForOtr = asyncHandler(async (req, res) => {
  const consents = consentService.listConsentsForOtr(req.params.otrId);
  ok(res, consents);
});

module.exports = {
  requestConsent,
  grantConsent,
  denyConsent,
  revokeConsent,
  getConsent,
  listConsentsForOtr,
};
