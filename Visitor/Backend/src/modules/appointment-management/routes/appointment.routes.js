const express = require('express');
const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { authenticate, authorize, optionalAuth } = require('../../../middleware/auth');
const appointmentController = require('../controllers/appointment.controller');

const router = Router();

// Configure multer file upload
const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `${hash}-${Date.now()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const allowedExts = /\.(jpeg|jpg|png|pdf)$/i;
    if (allowedMimes.includes(file.mimetype) && allowedExts.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported image format. Only JPEG, PNG, and PDF files are allowed.'));
    }
  },
});

const handleUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Maximum file size exceeded (5MB limit).', code: 'FILE_TOO_LARGE' });
      }
      return res.status(400).json({ error: err.message, code: 'UPLOAD_VALIDATION_ERROR' });
    }
    next();
  });
};

// Document upload endpoints
router.post('/upload', handleUpload('file'), (req, res) => {
  if (req.file) {
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({ fileName: req.file.originalname, fileUrl, docType: req.file.mimetype, size: req.file.size });
  }
  const fileName = req.body?.fileName || 'document_sample.pdf';
  const fileUrl = req.body?.fileUrl || '/uploads/sample_document.pdf';
  res.json({ fileName, fileUrl, docType: req.body?.docType || 'application/pdf', size: 102400 });
});

router.post('/upload/front', handleUpload('file'), (req, res) => {
  if (req.file) {
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({ fileName: req.file.originalname, fileUrl, docType: req.file.mimetype, side: 'front', size: req.file.size });
  }
  const fileName = req.body?.fileName || 'id_front_sample.jpg';
  const fileUrl = req.body?.fileUrl || '/uploads/id_front_sample.jpg';
  res.json({ fileName, fileUrl, docType: 'image/jpeg', side: 'front', size: 204800 });
});

router.post('/upload/back', handleUpload('file'), (req, res) => {
  if (req.file) {
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({ fileName: req.file.originalname, fileUrl, docType: req.file.mimetype, side: 'back', size: req.file.size });
  }
  const fileName = req.body?.fileName || 'id_back_sample.jpg';
  const fileUrl = req.body?.fileUrl || '/uploads/id_back_sample.jpg';
  res.json({ fileName, fileUrl, docType: 'image/jpeg', side: 'back', size: 204800 });
});

router.post('/upload/selfie', handleUpload('file'), (req, res) => {
  if (req.file) {
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({ fileName: req.file.originalname, fileUrl, docType: req.file.mimetype, side: 'selfie', size: req.file.size });
  }
  const fileName = req.body?.fileName || 'selfie_sample.jpg';
  const fileUrl = req.body?.fileUrl || '/uploads/selfie_sample.jpg';
  res.json({ fileName, fileUrl, docType: 'image/jpeg', side: 'selfie', size: 153600 });
});

router.post('/upload/selfie-base64', express.json({ limit: '10mb' }), (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.json({
        fileName: 'selfie_base64_sample.jpg',
        fileUrl: '/uploads/selfie_sample.jpg',
        docType: 'image/jpeg',
        side: 'selfie',
        size: 153600
      });
    }

    const matches = imageData.match(/^data:image\/(jpeg|jpg|png);base64,(.+)$/);
    if (!matches) {
      return res.json({
        fileName: 'selfie_base64_sample.jpg',
        fileUrl: '/uploads/selfie_sample.jpg',
        docType: 'image/jpeg',
        side: 'selfie',
        size: 153600
      });
    }

    const ext = matches[1] === 'jpg' ? 'jpeg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Maximum file size exceeded (5MB limit).', code: 'FILE_TOO_LARGE' });
    }

    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, buffer);
    const fileUrl = `/uploads/${filename}`;
    res.json({ fileName: filename, fileUrl, docType: `image/${ext}`, side: 'selfie', size: buffer.length });
  } catch (err) {
    console.error('[UPLOAD:SELFIE-BASE64] Failed:', err.message);
    res.status(500).json({ error: 'Failed to process selfie image.', code: 'PROCESSING_ERROR' });
  }
});

// Appointment workflows and queries
router.post('/', optionalAuth, (req, res, next) => appointmentController.create(req, res, next));
router.get('/track', (req, res, next) => appointmentController.track(req, res, next));
router.get('/dashboard-stats', authenticate, (req, res, next) => appointmentController.getDashboardStats(req, res, next));
router.get('/calendar', authenticate, (req, res, next) => appointmentController.getCalendar(req, res, next));
router.post('/check-eligibility', authenticate, (req, res, next) => appointmentController.checkEligibility(req, res, next));

// Approvals
router.get('/approvals/pending', authenticate, (req, res, next) => appointmentController.listPendingApprovals(req, res, next));
router.post('/approvals/:id/decision', authenticate, (req, res, next) => appointmentController.processApproval(req, res, next));

// CRUD
router.get('/', authenticate, (req, res, next) => appointmentController.list(req, res, next));
router.get('/:id', authenticate, (req, res, next) => appointmentController.get(req, res, next));
router.put('/:id/cancel', authenticate, (req, res, next) => appointmentController.cancel(req, res, next));
router.patch('/:id/approve', authenticate, authorize('admin', 'staff', 'employee', 'manager', 'department_manager'), (req, res, next) => appointmentController.approve(req, res, next));
router.patch('/:id/reject', authenticate, authorize('admin', 'staff', 'employee', 'manager', 'department_manager'), (req, res, next) => appointmentController.reject(req, res, next));
router.patch('/:id/reschedule', authenticate, authorize('admin', 'staff'), (req, res, next) => appointmentController.reschedule(req, res, next));

// Utility endpoints
router.get('/:id/qr', (req, res, next) => appointmentController.getQr(req, res, next));
router.post('/forgot-reference', (req, res, next) => appointmentController.forgotReference(req, res, next));
router.post('/verify-identity', (req, res, next) => appointmentController.verifyIdentity(req, res, next));

// Deletion & restoration
router.delete('/:id', authenticate, (req, res, next) => appointmentController.softDelete(req, res, next));
router.patch('/:id/restore', authenticate, authorize('admin'), (req, res, next) => appointmentController.restore(req, res, next));

module.exports = router;
