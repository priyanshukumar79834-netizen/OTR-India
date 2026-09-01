const applicationService = require('../services/applicationService');
const { ok, asyncHandler } = require('../utils/respond');

const createApplication = asyncHandler(async (req, res) => {
  const { otrId, portalId, consentId, profileVersionRef } = req.body;
  const application = applicationService.createApplication({ otrId, portalId, consentId, profileVersionRef });
  ok(res, application, 201);
});

const getApplication = asyncHandler(async (req, res) => {
  const application = applicationService.getApplication(req.params.id);
  ok(res, application);
});

const setApplicationData = asyncHandler(async (req, res) => {
  const { fieldName, fieldValue, isOverride } = req.body;
  const record = applicationService.setApplicationData(req.params.id, fieldName, fieldValue, { isOverride });
  ok(res, record, 201);
});

const getApplicationData = asyncHandler(async (req, res) => {
  const data = applicationService.getApplicationData(req.params.id);
  ok(res, data);
});

const validateApplication = asyncHandler(async (req, res) => {
  const result = applicationService.validateApplication(req.params.id);
  ok(res, result);
});

const submitApplication = asyncHandler(async (req, res) => {
  const application = applicationService.submitApplication(req.params.id);
  ok(res, application);
});

const listApplicationsForOtr = asyncHandler(async (req, res) => {
  const applications = applicationService.listApplicationsForOtr(req.params.otrId);
  ok(res, applications);
});

module.exports = {
  createApplication,
  getApplication,
  setApplicationData,
  getApplicationData,
  validateApplication,
  submitApplication,
  listApplicationsForOtr,
};
