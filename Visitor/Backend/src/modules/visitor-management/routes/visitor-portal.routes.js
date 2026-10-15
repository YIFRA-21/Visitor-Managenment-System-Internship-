const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../../../middleware/auth');
const controller = require('../controllers/visitor-portal.controller');

const router = Router();

// ─── File Upload Config ───────────────────────────
const uploadsDir = path.resolve(__dirname, '../../../../uploads');
const docDir = path.join(uploadsDir, 'documents');
const visitorDir = path.join(uploadsDir, 'visitors');

// Ensure directories exist
[docDir, visitorDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, docDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, visitorDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, JPG, JPEG, PNG'), false);
  }
};

const uploadDoc = multer({ storage: documentStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPhoto = multer({ storage: photoStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── All routes require authentication as visitor ──
router.use(authenticate);
router.use(authorize('visitor', 'admin'));

// ─── Dashboard ────────────────────────────────────
router.get('/dashboard', (req, res, next) => controller.getDashboard(req, res, next));

// ─── Profile ──────────────────────────────────────
router.get('/profile', (req, res, next) => controller.getProfile(req, res, next));
router.put('/profile', (req, res, next) => controller.updateProfile(req, res, next));
router.post('/profile/photo', uploadPhoto.single('photo'), (req, res, next) => controller.uploadPhoto(req, res, next));

// ─── Documents ────────────────────────────────────
router.get('/documents', (req, res, next) => controller.getDocuments(req, res, next));
router.post('/documents', uploadDoc.single('file'), (req, res, next) => controller.uploadDocument(req, res, next));
router.post('/documents/submit-to-host', (req, res, next) => controller.submitDocumentsToHost(req, res, next));
router.put('/documents/:id', uploadDoc.single('file'), (req, res, next) => controller.updateDocument(req, res, next));
router.delete('/documents/:id', (req, res, next) => controller.deleteDocument(req, res, next));


// ─── Appointments ─────────────────────────────────
router.get('/appointments', (req, res, next) => controller.getAppointments(req, res, next));
router.get('/appointments/:id', (req, res, next) => controller.getAppointmentDetail(req, res, next));
router.post('/appointments', (req, res, next) => controller.createAppointment(req, res, next));
router.patch('/appointments/:id/cancel', (req, res, next) => controller.cancelAppointment(req, res, next));
router.delete('/appointments/:id', (req, res, next) => controller.deleteAppointment(req, res, next));
router.patch('/appointments/:id/reschedule', (req, res, next) => controller.rescheduleAppointment(req, res, next));

// ─── Passes ───────────────────────────────────────
router.get('/passes', (req, res, next) => controller.getPasses(req, res, next));
router.get('/passes/:id/qr', (req, res, next) => controller.getPassQR(req, res, next));

// ─── History ──────────────────────────────────────
router.get('/history', (req, res, next) => controller.getHistory(req, res, next));

// ─── Notifications ────────────────────────────────
router.get('/notifications', (req, res, next) => controller.getNotifications(req, res, next));
router.patch('/notifications/:id/read', (req, res, next) => controller.markNotificationRead(req, res, next));
router.patch('/notifications/read-all', (req, res, next) => controller.markAllNotificationsRead(req, res, next));

// ─── Feedback ─────────────────────────────────────
router.post('/feedback', (req, res, next) => controller.submitFeedback(req, res, next));
router.get('/feedback', (req, res, next) => controller.getFeedback(req, res, next));

// ─── Support Tickets ──────────────────────────────
router.post('/support', (req, res, next) => controller.createSupportTicket(req, res, next));
router.get('/support', (req, res, next) => controller.getSupportTickets(req, res, next));

// ─── Settings/Preferences ────────────────────────
router.get('/settings', (req, res, next) => controller.getSettings(req, res, next));
router.put('/settings', (req, res, next) => controller.updateSettings(req, res, next));

module.exports = router;
