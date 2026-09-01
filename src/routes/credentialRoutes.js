const express = require('express');
const controller = require('../controllers/credentialController');

const router = express.Router();

router.post('/', controller.submitCredential);
router.get('/otr/:otrId', controller.listCredentialsForOtr);
router.get('/:id', controller.getCredential);
router.post('/:id/request-verification', controller.requestVerification);
router.post('/:id/verify', controller.runMockVerification); // triggers the mock issuer
router.post('/:id/revoke', controller.revokeCredential);

module.exports = router;
