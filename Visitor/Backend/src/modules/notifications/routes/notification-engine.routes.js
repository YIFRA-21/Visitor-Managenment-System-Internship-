const express = require('express');
const router = express.Router();
const NotificationEngineController = require('../controllers/notification-engine.controller');
const { authenticateToken } = require('../../../middleware/auth');
const permissionResolver = require('../../../middleware/permissionResolver');
const { applySecurityHeaders, requestSanitizer } = require('../../../middleware/securityHeaders');
const { validateRuleInput, validateEventProcessInput } = require('../validators/notification-rules.validator');

router.use(applySecurityHeaders);
router.use(requestSanitizer);
router.use(authenticateToken);

// GET /api/notification-engine/status
router.get('/status', (req, res) => NotificationEngineController.getStatus(req, res));

// POST /api/notification-engine/process-event
router.post(
  '/process-event',
  permissionResolver('notification.rule.execute'),
  validateEventProcessInput,
  (req, res) => NotificationEngineController.processEvent(req, res)
);

// POST /api/notification-engine/rules
router.post(
  '/rules',
  permissionResolver('notification.rule.manage'),
  validateRuleInput,
  (req, res) => NotificationEngineController.createRule(req, res)
);

// GET /api/notification-engine/analytics
router.get(
  '/analytics',
  permissionResolver('notification.rule.analytics'),
  (req, res) => NotificationEngineController.getAnalytics(req, res)
);

module.exports = router;
