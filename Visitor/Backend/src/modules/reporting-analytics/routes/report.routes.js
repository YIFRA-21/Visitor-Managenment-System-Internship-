const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const reportController = require('../controllers/report.controller');

const router = Router();

// GET /dashboard: fetches VMS stats, approval rates, and trends
router.get('/dashboard', authenticate, reportController.getDashboard);

// GET /visitors: lists visitor profiles with their visit counts and metadata
router.get('/visitors', authenticate, reportController.getVisitors);

// GET /checkins: lists real physical and turnstile check-in/out logs with real duration & counts
router.get('/checkins', authenticate, reportController.getCheckinLogs);

// GET /audit-logs: lists security & governance audit logs with dynamic aggregation metrics
router.get('/audit-logs', authenticate, reportController.getAuditLogs);

// GET /security: lists real security alerts, incidents, watchlist entries, and clearance events
router.get('/security', authenticate, reportController.getSecurity);

// Advanced reporting routes
router.get('/daily', authenticate, reportController.getDaily);
router.get('/monthly', authenticate, reportController.getMonthly);
router.get('/employee-stats', authenticate, reportController.getEmployeeStats);
router.get('/peak-hours', authenticate, reportController.getPeakHours);
router.get('/history', authenticate, reportController.getHistory);

// ── Module 14: Enterprise BI & Analytics Routes ──────────────────────────────
router.get('/kpis', authenticate, reportController.getKPIs);
router.get('/departments', authenticate, reportController.getDepartments);
router.get('/occupancy', authenticate, reportController.getOccupancy);
router.get('/saved', authenticate, reportController.getSaved);
router.post('/custom', authenticate, reportController.saveCustom);

module.exports = router;
