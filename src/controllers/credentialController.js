const credentialService = require('../services/credentialService');
const { ok, asyncHandler } = require('../utils/respond');

const submitCredential = asyncHandler(async (req, res) => {
  const { otrId, type, reference, issueDate, expiry, documentRef } = req.body;
  const credential = credentialService.submitCredential({ otrId, type, reference, issueDate, expiry, documentRef });
  ok(res, credential, 201);
});

const getCredential = asyncHandler(async (req, res) => {
  const credential = credentialService.getCredential(req.params.id);
  ok(res, credential);
});

const listCredentialsForOtr = asyncHandler(async (req, res) => {
  const credentials = credentialService.listCredentialsForOtr(req.params.otrId);
  ok(res, credentials);
});

const requestVerification = asyncHandler(async (req, res) => {
  const credential = credentialService.requestVerification(req.params.id);
  ok(res, credential);
});

const runMockVerification = asyncHandler(async (req, res) => {
  const credential = credentialService.runMockVerification(req.params.id);
  ok(res, credential);
});

const revokeCredential = asyncHandler(async (req, res) => {
  const credential = credentialService.revokeCredential(req.params.id);
  ok(res, credential);
});

module.exports = {
  submitCredential,
  getCredential,
  listCredentialsForOtr,
  requestVerification,
  runMockVerification,
  revokeCredential,
};
