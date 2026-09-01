const express = require('express');
const controller = require('../controllers/applicationController');

const router = express.Router();

router.post('/', controller.createApplication);
router.get('/otr/:otrId', controller.listApplicationsForOtr);
router.get('/:id', controller.getApplication);
router.post('/:id/data', controller.setApplicationData);
router.get('/:id/data', controller.getApplicationData);
router.get('/:id/validate', controller.validateApplication);
router.post('/:id/submit', controller.submitApplication);

module.exports = router;
