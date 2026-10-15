const express = require('express');
const router = express.Router();
const NotificationPersistenceController = require('../controllers/notification-persistence.controller');
const { authenticateToken } = require('../../../middleware/auth');
const permissionResolver = require('../../../middleware/permissionResolver');
const { validatePagination } = require('../validators/notification.validator');

router.use(authenticateToken);

// Notification Rules Persistence API
router.get(
  '/rules',
  permissionResolver('notification.view'),
  validatePagination,
  (req, res) => NotificationPersistenceController.getRules(req, res)
);

router.post(
  '/rules',
  permissionResolver('notification.create'),
  (req, res) => NotificationPersistenceController.createRule(req, res)
);

router.delete(
  '/rules/:id',
  permissionResolver('notification.delete'),
  (req, res) => NotificationPersistenceController.softDeleteRule(req, res)
);

router.post(
  '/rules/:id/restore',
  permissionResolver('notification.update'),
  (req, res) => NotificationPersistenceController.restoreRule(req, res)
);

module.exports = router;
