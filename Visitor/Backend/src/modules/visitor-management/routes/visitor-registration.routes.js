const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const controller = require('../controllers/visitor-registration.controller');

const router = Router();

// Module 4.2 REST APIs: Protected via JWT Auth
router.use(authenticate);

// Public / Self-registration & Operator endpoints
router.post('/register', (req, res, next) => controller.register(req, res, next));
router.post('/validate', (req, res, next) => controller.validate(req, res, next));

// Draft operations
router.post('/save-draft', (req, res, next) => controller.saveDraft(req, res, next));
router.get('/drafts', (req, res, next) => controller.listDrafts(req, res, next));
router.get('/draft/:draftId', (req, res, next) => controller.getDraft(req, res, next));

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '../../../../uploads');
const docDir = path.join(uploadsDir, 'documents');
const visitorDir = path.join(uploadsDir, 'visitors');
[docDir, visitorDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const uploadPhotoMulter = multer({ dest: visitorDir });
const uploadDocMulter = multer({ dest: docDir });

// Upload handlers
router.post('/upload-photo', (req, res, next) => {
  uploadPhotoMulter.any()(req, res, (err) => {
    controller.uploadPhoto(req, res, next);
  });
});
router.post('/upload-document', (req, res, next) => {
  uploadDocMulter.any()(req, res, (err) => {
    controller.uploadDocument(req, res, next);
  });
});

// Registration Records & Details
router.get('/history', (req, res, next) => controller.list(req, res, next));
router.get('/', (req, res, next) => controller.list(req, res, next));
router.get('/:id', (req, res, next) => controller.getDetails(req, res, next));
router.put('/:id', (req, res, next) => controller.update(req, res, next));

module.exports = router;
