const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const reportController = require('../controllers/report.controller');
const db = require('../../../config/db');

const router = Router();

// GET /dashboard: fetches VMS stats, approval rates, and trends
router.get('/dashboard', authenticate, authorize('admin', 'staff'), reportController.getDashboard);

// GET /visitors: lists visitor profiles with their visit counts
router.get('/visitors', authenticate, authorize('admin', 'staff', 'security_officer'), async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let sql = `
      SELECT v.*, COUNT(a.id) as visit_count, MAX(a.scheduled_start) as last_visit
      FROM visitors v
      LEFT JOIN appointments a ON v.id = a.visitor_id
      WHERE v.is_active = TRUE
    `;
    const params = [];

    if (from) {
      sql += ' AND a.scheduled_start >= ?';
      params.push(from);
    }
    if (to) {
      sql += ' AND a.scheduled_start <= ?';
      params.push(to);
    }

    sql += ' GROUP BY v.id ORDER BY last_visit DESC LIMIT 100';
    const visitors = await db.query(sql, params);
    res.json(visitors);
  } catch (err) {
    next(err);
  }
});

// GET /audit-logs: lists security audit log activities
router.get('/audit-logs', authenticate, authorize('admin', 'security_officer'), async (req, res, next) => {
  try {
    const logs = await db.query(
      `SELECT al.*, u.full_name as actor_name 
       FROM audit_logs al
       LEFT JOIN users u ON COALESCE(al.actor_id, al.user_id) = u.id
       ORDER BY al.created_at DESC LIMIT 200`
    );
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// Advanced reporting routes
router.get('/daily', authenticate, authorize('admin', 'security_officer'), reportController.getDaily);
router.get('/monthly', authenticate, authorize('admin', 'security_officer'), reportController.getMonthly);
router.get('/employee-stats', authenticate, authorize('admin'), reportController.getEmployeeStats);
router.get('/security', authenticate, authorize('admin', 'security_officer'), reportController.getSecurity);
router.get('/peak-hours', authenticate, authorize('admin', 'security_officer'), reportController.getPeakHours);
router.get('/history', authenticate, authorize('admin', 'security_officer'), reportController.getHistory);

// ── Module 14: Enterprise BI & Analytics Routes ──────────────────────────────
router.get('/kpis', authenticate, authorize('admin', 'staff', 'security_officer'), reportController.getKPIs);
router.get('/departments', authenticate, authorize('admin', 'staff'), reportController.getDepartments);
router.get('/occupancy', authenticate, authorize('admin', 'staff', 'security_officer'), reportController.getOccupancy);
router.get('/saved', authenticate, authorize('admin', 'staff'), reportController.getSaved);
router.post('/custom', authenticate, authorize('admin'), reportController.saveCustom);

module.exports = router;

