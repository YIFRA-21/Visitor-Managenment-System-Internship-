const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate, authorize, optionalAuth } = require('../../../middleware/auth');
const { loginRateLimiter, forgotPasswordRateLimiter } = require('../../../middleware/rateLimiter');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = Router();

// Multer Storage Configuration for user avatar uploads
const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG files are allowed'));
    }
  },
});

// Authentication Endpoints
router.post('/check-email', authController.checkEmail);
router.post('/check-username', authController.checkUsername);
router.get('/admin/duplicate-emails', authenticate, authorize('admin'), authController.getDuplicateEmailsReport);
router.post('/register', optionalAuth, authController.register);
router.get('/login', (_req, res) => {
  res.status(200).json({
    endpoint: '/api/auth/login',
    method: 'POST',
    message: 'To log in, send an HTTP POST request with your email and password.',
    sampleRequestBody: {
      email: 'belayyifra1@gmail.com',
      password: 'AdminPassword123'
    },
    note: 'In Postman, select POST method, Headers: Content-Type: application/json, and Body: raw JSON.'
  });
});
router.post('/login', loginRateLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', forgotPasswordRateLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/change-password', authenticate, authController.changePassword);
router.put('/change-password', authenticate, authController.changePassword);
router.get('/me', authenticate, authController.getMe);
router.get('/me/permissions', authenticate, authController.getMyPermissions);
router.get('/me/resources', authenticate, authController.getMyResources);
router.get('/profile', authenticate, authController.getMyProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.delete('/profile', authenticate, authController.deleteMyProfile);

// Session Management Endpoints
router.get('/sessions', authenticate, authController.getActiveSessions);
router.delete('/sessions/:id', authenticate, authController.terminateSession);
router.delete('/sessions', authenticate, authController.terminateAllSessions);

// User Management (Admin Only)
router.get('/users', authenticate, authorize('admin'), authController.listUsers);
router.patch('/users/:id', authenticate, authorize('admin'), authController.updateUser);

// Avatar Upload
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      if (req.body && (req.body.avatarUrl || req.body.avatar)) {
        const avatarUrl = req.body.avatarUrl || req.body.avatar;
        const db = require('../../../config/db');
        await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
        return res.status(200).json({ message: 'Avatar updated successfully', avatarUrl });
      }
      return res.status(400).json({ error: 'No file uploaded. Please upload an image file using multipart/form-data with field name "avatar" or pass "avatarUrl" in JSON.' });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    const db = require('../../../config/db');
    await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
    res.status(200).json({ message: 'Avatar updated successfully', avatarUrl });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
