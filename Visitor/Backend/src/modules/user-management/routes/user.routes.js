const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { checkPermission } = require('../../../middleware/rbac');
const userController = require('../controllers/user.controller');

// Authentication required for all User Management APIs
router.use(authenticate);

// Real-time KPI Statistics
router.get('/statistics', checkPermission('USER:READ'), (req, res, next) => userController.getStatistics(req, res, next));
router.get('/stats', checkPermission('USER:READ'), (req, res, next) => userController.getStatistics(req, res, next));

// Invitations Lifecycle
router.post('/invitations', checkPermission('USER:CREATE'), (req, res, next) => userController.createInvitation(req, res, next));
router.get('/invitations', checkPermission('USER:READ'), (req, res, next) => userController.getInvitations(req, res, next));
router.post('/invitations/:id/resend', checkPermission('USER:MANAGE'), (req, res, next) => userController.resendInvitation(req, res, next));
router.delete('/invitations/:id', checkPermission('USER:MANAGE'), (req, res, next) => userController.cancelInvitation(req, res, next));

// Saved Search Presets
router.get('/saved-searches', checkPermission('USER:READ'), (req, res, next) => userController.getSavedSearches(req, res, next));
router.post('/saved-searches', checkPermission('USER:READ'), (req, res, next) => userController.saveSearch(req, res, next));
router.delete('/saved-searches/:id', checkPermission('USER:READ'), (req, res, next) => userController.deleteSavedSearch(req, res, next));

// Bulk Operations
router.post('/bulk-status', checkPermission('USER:MANAGE'), (req, res, next) => userController.bulkStatus(req, res, next));
router.post('/bulk-notify', checkPermission('USER:MANAGE'), (req, res, next) => userController.bulkNotify(req, res, next));

// Bulk Import & Dataset Export
router.post('/import', checkPermission('USER:CREATE'), (req, res, next) => userController.importUsers(req, res, next));
router.get('/export', checkPermission('USER:READ'), (req, res, next) => userController.exportUsers(req, res, next));

// List Users with pagination, search & filters
router.get('/', checkPermission('USER:READ'), (req, res, next) => userController.list(req, res, next));

// Get Single User Details
router.get('/:id', checkPermission('USER:READ'), (req, res, next) => userController.getById(req, res, next));

// Create New User (Transaction-backed with User ID generation)
router.post('/', checkPermission('USER:CREATE'), (req, res, next) => userController.create(req, res, next));

// Update User Profile
router.put('/:id', checkPermission('USER:UPDATE'), (req, res, next) => userController.update(req, res, next));

// Account Lifecycle State Transitions
router.patch('/:id/status', checkPermission('USER:MANAGE'), (req, res, next) => userController.updateStatus(req, res, next));
router.patch('/:id/lock', checkPermission('USER:MANAGE'), (req, res, next) => userController.lock(req, res, next));
router.patch('/:id/unlock', checkPermission('USER:MANAGE'), (req, res, next) => userController.unlock(req, res, next));
router.patch('/:id/block', checkPermission('USER:MANAGE'), (req, res, next) => userController.block(req, res, next));
router.patch('/:id/unblock', checkPermission('USER:MANAGE'), (req, res, next) => userController.unblock(req, res, next));

// Archival, Restoration & Deletion
router.delete('/:id', checkPermission('USER:MANAGE'), (req, res, next) => userController.delete(req, res, next));
router.post('/:id/archive', checkPermission('USER:MANAGE'), (req, res, next) => userController.archive(req, res, next));
router.post('/:id/restore', checkPermission('USER:MANAGE'), (req, res, next) => userController.restore(req, res, next));

// Contact Verification Resends
router.post('/:id/resend-email-verification', checkPermission('USER:MANAGE'), (req, res, next) => userController.resendEmailVerification(req, res, next));
router.post('/:id/resend-phone-verification', checkPermission('USER:MANAGE'), (req, res, next) => userController.resendPhoneVerification(req, res, next));

// Password Reset & Credentials Dispatch
router.patch('/:id/reset-password', checkPermission('USER:MANAGE'), (req, res, next) => userController.resetPassword(req, res, next));
router.post('/:id/reset-password', checkPermission('USER:MANAGE'), (req, res, next) => userController.resetPassword(req, res, next));
router.post('/:id/send-credentials', checkPermission('USER:MANAGE'), (req, res, next) => userController.sendCredentials(req, res, next));
router.post('/:id/resend-registration-email', checkPermission('USER:MANAGE'), (req, res, next) => userController.sendCredentials(req, res, next));

// User Sessions & Devices
router.get('/:id/sessions', checkPermission('USER:READ'), (req, res, next) => userController.getSessions(req, res, next));
router.delete('/:id/sessions/all', checkPermission('USER:MANAGE'), (req, res, next) => userController.revokeAllSessions(req, res, next));
router.delete('/:id/sessions/:sessionId', checkPermission('USER:MANAGE'), (req, res, next) => userController.revokeSession(req, res, next));

// Login History & User Activity Logs
router.get('/:id/login-history', checkPermission('USER:READ'), (req, res, next) => userController.getLoginHistory(req, res, next));
router.get('/:id/activity', checkPermission('USER:READ'), (req, res, next) => userController.getActivity(req, res, next));

module.exports = router;
