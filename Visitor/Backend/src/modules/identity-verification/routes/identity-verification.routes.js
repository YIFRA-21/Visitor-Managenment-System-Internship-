const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const controller = require('../controllers/identity-verification.controller');
const { authenticate } = require('../../../middleware/auth');
const { checkPermission } = require('../../../middleware/rbac');
const validators = require('../validators/identity-verification.validator');

// Secure private file storage configuration
const PRIVATE_DIR = path.join(__dirname, '../../../../uploads/identity_private');
if (!fs.existsSync(PRIVATE_DIR)) {
  fs.mkdirSync(PRIVATE_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PRIVATE_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `id-doc-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid identity document file format. Allowed: JPG, PNG, WEBP, PDF.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit per file
});

const uploadFields = upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]);

// ── 1. Unauthenticated Webhook Endpoint (Cryptographically Verified by Signature) ──
router.post('/webhooks/:provider', (req, res, next) => controller.handleWebhook(req, res, next));

// ── 2. Authenticated Endpoints ──
router.use(authenticate);

// Visitor Self-Service Endpoints
router.get('/status', (req, res, next) => controller.getStatus(req, res, next));
router.post('/cases', validators.createCaseValidator, (req, res, next) => controller.createCase(req, res, next));
router.post(
  '/cases/:caseId/evidence',
  uploadFields,
  validators.submitEvidenceValidator,
  (req, res, next) => controller.submitEvidence(req, res, next)
);

// Reviewer Endpoints (Security Officer, Administrator, Receptionist)
router.get('/reviewer/queue', (req, res, next) => controller.getReviewerQueue(req, res, next));
router.get('/reviewer/cases/:caseId', (req, res, next) => controller.getCaseDetail(req, res, next));
router.post(
  '/reviewer/cases/:caseId/decision',
  validators.reviewDecisionValidator,
  (req, res, next) => controller.recordDecision(req, res, next)
);
router.delete('/reviewer/cases/:caseId', (req, res, next) => controller.deleteCase(req, res, next));

// Administrator Policy Configuration Endpoints
router.get('/policies', (req, res, next) => controller.getPolicy(req, res, next));
router.put(
  '/policies',
  validators.policyUpdateValidator,
  (req, res, next) => controller.updatePolicy(req, res, next)
);

module.exports = router;
