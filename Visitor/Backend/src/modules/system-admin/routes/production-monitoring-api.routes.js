const express = require('express');
const router = express.Router();
const ProductionMonitoringController = require('../controllers/production-monitoring.controller');
const { authenticateToken } = require('../../../middleware/auth');
const permissionResolver = require('../../../middleware/permissionResolver');

router.use(authenticateToken);

// Part 8 REST API Endpoints
router.get('/live', (req, res) => ProductionMonitoringController.getLiveNotifications(req, res));
router.get('/unread', (req, res) => ProductionMonitoringController.getUnreadCount(req, res));
router.get(
  '/queue-stats',
  permissionResolver('notification.queue.manage'),
  (req, res) => ProductionMonitoringController.getQueueDashboard(req, res)
);
router.get(
  '/analytics-summary',
  permissionResolver('notification.analytics.view'),
  (req, res) => ProductionMonitoringController.getAnalyticsSummary(req, res)
);
router.get(
  '/health',
  permissionResolver('notification.health.view'),
  (req, res) => ProductionMonitoringController.getHealthStatus(req, res)
);
router.get(
  '/security-logs',
  permissionResolver('notification.security.view'),
  (req, res) => ProductionMonitoringController.getSecurityLogs(req, res)
);
router.get(
  '/deployment-specs',
  permissionResolver('notification.deployment.manage'),
  (req, res) => ProductionMonitoringController.getDeploymentSpecs(req, res)
);

module.exports = router;
