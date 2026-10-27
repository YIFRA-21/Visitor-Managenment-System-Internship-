const { Router } = require('express');
const { authenticate, optionalAuth } = require('../../../middleware/auth');
const controller = require('../controllers/identity-verification.controller');

const router = Router();

// Open/Optional Auth for Mobile QR Sync & Cross-Device Capture (Phone needs no password login)
router.get('/mobile-status/:token', optionalAuth, (req, res, next) => controller.getMobileStatus(req, res, next));
router.get('/mobile/:token/session', optionalAuth, (req, res, next) => controller.getMobileSession(req, res, next));
router.post('/mobile/:token/upload-front', optionalAuth, (req, res, next) => controller.uploadMobileFront(req, res, next));
router.post('/mobile/:token/upload-back', optionalAuth, (req, res, next) => controller.uploadMobileBack(req, res, next));
router.post('/mobile/:token/upload-selfie', optionalAuth, (req, res, next) => controller.uploadMobileSelfie(req, res, next));
router.post('/mobile/:token/complete', optionalAuth, (req, res, next) => controller.completeMobile(req, res, next));

// Protected via JWT Auth
router.use(authenticate);

// Start verification session & Mobile Session
router.post('/start', (req, res, next) => controller.start(req, res, next));
router.post('/:id/mobile-session', (req, res, next) => controller.createMobileSession(req, res, next));

// Document capture
router.post('/:id/upload-front', (req, res, next) => controller.uploadFront(req, res, next));
router.post('/:id/upload-back', (req, res, next) => controller.uploadBack(req, res, next));
router.post('/:id/upload-selfie', (req, res, next) => controller.uploadSelfie(req, res, next));

// Processing steps
router.post('/:id/analyze-document', (req, res, next) => controller.analyzeDocument(req, res, next));
router.post('/:id/run-ocr', (req, res, next) => controller.runOCR(req, res, next));
router.post('/:id/run-liveness', (req, res, next) => controller.runLiveness(req, res, next));
router.post('/:id/run-facematch', (req, res, next) => controller.runFaceMatch(req, res, next));
router.post('/:id/validate-security', (req, res, next) => controller.validateSecurity(req, res, next));
router.post('/:id/complete', (req, res, next) => controller.complete(req, res, next));

// History, Report & Session retrieval
router.get('/:id/report', (req, res, next) => controller.getReport(req, res, next));
router.get('/history/:visitorId', (req, res, next) => controller.getHistory(req, res, next));
router.get('/:id', (req, res, next) => controller.getSession(req, res, next));

module.exports = router;
