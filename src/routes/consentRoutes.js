const express = require('express');
const controller = require('../controllers/consentController');

const router = express.Router();

router.post('/request', controller.requestConsent);
router.post('/:id/grant', controller.grantConsent);
router.post('/:id/deny', controller.denyConsent);
router.post('/:id/revoke', controller.revokeConsent);
router.get('/otr/:otrId', controller.listConsentsForOtr);
router.get('/:id', controller.getConsent);

module.exports = router;
