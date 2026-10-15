const express = require('express');
const router = express.Router();
const NotificationComposerController = require('../controllers/notification-composer.controller');
const { authenticateToken } = require('../../../middleware/auth');

// All endpoints protected by JWT authentication
router.use(authenticateToken);

router.post('/compose', (req, res) => NotificationComposerController.compose(req, res));
router.get('/drafts', (req, res) => NotificationComposerController.getDrafts(req, res));
router.get('/schedules', (req, res) => NotificationComposerController.getSchedules(req, res));
router.get('/broadcasts', (req, res) => NotificationComposerController.getBroadcasts(req, res));
router.get('/delivery', (req, res) => NotificationComposerController.getDeliveryTracking(req, res));
router.post('/retry/:id', (req, res) => NotificationComposerController.retryDelivery(req, res));
router.get('/queues', (req, res) => NotificationComposerController.getQueues(req, res));

module.exports = router;
