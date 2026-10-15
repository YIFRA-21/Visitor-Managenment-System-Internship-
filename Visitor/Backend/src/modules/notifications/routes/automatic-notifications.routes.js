const express = require('express');
const router = express.Router();
const NotificationEngineController = require('../controllers/notification-engine.controller');
const { authenticateToken } = require('../../../middleware/auth');

// All automatic notification engine routes protected by JWT auth
router.use(authenticateToken);

router.post('/trigger-event', (req, res) => NotificationEngineController.triggerEvent(req, res));
router.get('/analytics', (req, res) => NotificationEngineController.getAnalytics(req, res));
router.get('/queues', (req, res) => NotificationEngineController.getQueueStatus(req, res));
router.post('/queues/control', (req, res) => NotificationEngineController.controlQueue(req, res));
router.post('/rules/evaluate', (req, res) => NotificationEngineController.evaluateRule(req, res));

module.exports = router;
