const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('../controllers/document.controller');
const { authenticate } = require('../../../middleware/auth');

const { DOCUMENTS_DIR } = require('../../../utils/fileStorage');
const uploadDir = DOCUMENTS_DIR;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

// File Filter (MIME Type & Format Validation)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Allowed: PDF, JPG, PNG, WEBP, DOCX, XLSX, TXT.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ─── Module 4.7 Visitor Document Management Routes ───

// Dashboard Metrics
router.get('/dashboard', authenticate, controller.getDashboard);

// Categories & Status Registries
router.get('/categories', authenticate, controller.getCategories);
router.post('/categories', authenticate, controller.createCategory);
router.get('/statuses', authenticate, controller.getStatuses);

// OCR Metadata Extraction
router.post('/ocr-extract', authenticate, upload.single('file'), controller.ocrExtract);

// Bulk Upload
router.post('/bulk-upload', authenticate, upload.array('files', 10), controller.bulkUpload);

// Document Listing & CRUD
router.get('/', authenticate, controller.getDocuments);
router.get('/:id', authenticate, controller.getDocumentById);
router.post('/', authenticate, upload.single('file'), controller.uploadDocument);
router.put('/:id', authenticate, controller.updateMetadata);
router.post('/:id/replace', authenticate, upload.single('file'), controller.replaceDocument);
router.get('/:id/download', authenticate, controller.downloadDocument);
router.get('/:id/view', authenticate, (req, res, next) => { req.query.inline = 'true'; controller.downloadDocument(req, res, next); });
router.get('/:id/preview', authenticate, (req, res, next) => { req.query.inline = 'true'; controller.downloadDocument(req, res, next); });

// Verifications & Approvals
router.post('/:id/verify', authenticate, controller.verifyDocument);
router.post('/:id/approve', authenticate, controller.approveDocument);
router.post('/:id/restore-version/:versionNumber', authenticate, controller.restoreVersion);

// Status & Lifecycle Actions
router.patch('/:id/status', authenticate, controller.updateStatus);
router.patch('/:id/archive', authenticate, controller.archiveDocument);
router.patch('/:id/restore', authenticate, controller.restoreDocument);
router.delete('/:id', authenticate, controller.deleteDocument);

module.exports = router;
