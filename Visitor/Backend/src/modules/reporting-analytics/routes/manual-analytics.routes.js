const express = require('express');
const router = express.Router();
const manualAnalyticsController = require('../controllers/manual-analytics.controller');
const { authenticateToken } = require('../../../middleware/auth');

// Protected by JWT authentication
router.use(authenticateToken);

router.get('/kpis', (req, res) => manualAnalyticsController.getKpis(req, res));
router.get('/charts', (req, res) => manualAnalyticsController.getCharts(req, res));
router.get('/audit-logs', (req, res) => manualAnalyticsController.getAuditLogs(req, res));
router.get('/permissions', (req, res) => manualAnalyticsController.getPermissionMatrix(req, res));

module.exports = router;
