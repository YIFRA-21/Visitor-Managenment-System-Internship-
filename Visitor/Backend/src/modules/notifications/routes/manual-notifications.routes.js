const express = require('express');
const router = express.Router();
const ManualNotificationController = require('../controllers/manual-notification.controller');
const { authenticateToken } = require('../../../middleware/auth');

// All manual notification routes protected by JWT auth
router.use(authenticateToken);

// Dashboard & Statistics
router.get('/dashboard', (req, res) => ManualNotificationController.getDashboard(req, res));
router.get('/statistics', (req, res) => ManualNotificationController.getStatistics(req, res));
router.get('/recent', (req, res) => ManualNotificationController.getRecent(req, res));
router.get('/drafts', (req, res) => ManualNotificationController.getDrafts(req, res));

// Create & Dispatch
router.post('/dispatch', (req, res) => ManualNotificationController.dispatch(req, res));
router.post('/draft', (req, res) => ManualNotificationController.saveDraft(req, res));
router.post('/preview', (req, res) => ManualNotificationController.preview(req, res));

// Recipient Resolution
router.get('/recipients/search', (req, res) => ManualNotificationController.searchRecipients(req, res));
router.post('/recipients/validate', (req, res) => ManualNotificationController.validateRecipients(req, res));

// Channel Discovery
router.get('/channels', (req, res) => ManualNotificationController.getChannels(req, res));

module.exports = router;
