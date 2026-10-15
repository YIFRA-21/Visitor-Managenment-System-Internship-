const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const visitorService = require('../../visitor-management/services/visitor.service');
const appointmentService = require('../../appointment-management/services/appointment.service');
const db = require('../../../config/db');
const auditRepository = require('../../audit-log/repositories/audit.repository');

const router = Router();

// GET /blacklist: gets all blacklisted visitors
router.get('/blacklist', authenticate, authorize('admin', 'security_officer'), async (req, res, next) => {
  try {
    const useMock = db.getUseMock();
    const tableName = useMock ? 'blacklist' : 'visitor_blacklist';
    const addedByCol = useMock ? 'added_by' : 'blocked_by';

    const list = await db.query(
      `SELECT b.id, b.visitor_id as visitorId, b.reason, b.created_at as createdAt,
              v.full_name as fullName, v.email, v.phone, v.company, u.full_name as addedByName
       FROM ${tableName} b
       JOIN visitors v ON b.visitor_id = v.id
       JOIN users u ON b.${addedByCol} = u.id
       ORDER BY b.created_at DESC`
    );
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// POST /blacklist: adds visitor to blacklist
router.post('/blacklist', authenticate, authorize('admin', 'security_officer'), async (req, res, next) => {
  try {
    const { visitorId, reason } = req.body;
    if (!visitorId || !reason) {
      return res.status(400).json({ error: 'Visitor ID and reason are required' });
    }

    await visitorService.blacklistVisitor(visitorId, reason, req.user.id);
    res.status(201).json({ message: 'Visitor added to blacklist' });
  } catch (err) {
    next(err);
  }
});

// DELETE /blacklist/:id: removes visitor from blacklist
router.delete('/blacklist/:id', authenticate, authorize('admin', 'security_officer'), async (req, res, next) => {
  try {
    const useMock = db.getUseMock();
    const tableName = useMock ? 'blacklist' : 'visitor_blacklist';

    const entries = await db.query(
      `SELECT visitor_id FROM ${tableName} WHERE id = ?`,
      [req.params.id]
    );
    if (!entries[0]) return res.status(404).json({ error: 'Not found' });

    const visitorId = entries[0].visitor_id;

    await db.transaction(async (tx) => {
      await tx.execute(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      await tx.execute(`UPDATE visitors SET is_blacklisted = FALSE, status = 'ACTIVE' WHERE id = ?`, [visitorId]);
    });

    await auditRepository.log({
      userId: req.user.id,
      action: 'BLACKLIST_REMOVE',
      module: 'SECURITY',
      entity: 'visitors',
      recordId: visitorId,
    });

    res.json({ message: 'Removed from blacklist' });
  } catch (err) {
    next(err);
  }
});

// GET /verify/:referenceCode: verifies appointment reference code
router.get('/verify/:referenceCode', authenticate, authorize('security_officer', 'receptionist', 'admin'), async (req, res, next) => {
  try {
    const { referenceCode } = req.params;
    const appointment = await appointmentService.appointmentRepository.findByReferenceCode(referenceCode);
    if (!appointment) return res.status(404).json({ error: 'Not found' });
    res.json(appointment);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// MODULE 12: Enterprise Security & Access Control Management Endpoints
// ──────────────────────────────────────────────────────────────────────────
const securityController = require('../controllers/security.controller');

// GET /security/dashboard — SOC control room dashboard KPIs & stats
router.get('/dashboard', authenticate, authorize('security_officer', 'admin', 'manager'), securityController.getDashboard);

// GET /security/watchlist & POST /security/watchlist & DELETE /security/watchlist/:id
router.get('/watchlist', authenticate, authorize('security_officer', 'admin'), securityController.getWatchlist);
router.post('/watchlist', authenticate, authorize('security_officer', 'admin'), securityController.addToWatchlist);
router.delete('/watchlist/:id', authenticate, authorize('security_officer', 'admin'), securityController.removeFromWatchlist);

// GET /security/incidents & POST /security/incidents & PUT /security/incidents/:id
router.get('/incidents', authenticate, authorize('security_officer', 'admin', 'manager'), securityController.getIncidents);
router.post('/incidents', authenticate, authorize('security_officer', 'admin'), securityController.reportIncident);
router.put('/incidents/:id', authenticate, authorize('security_officer', 'admin'), securityController.updateIncident);

// GET /security/access-rules — Zone & building access control rules
router.get('/access-rules', authenticate, authorize('security_officer', 'admin'), securityController.getAccessRules);

// GET /security/escorts & POST /security/escorts — Security escort assignments
router.get('/escorts', authenticate, authorize('security_officer', 'admin'), securityController.getEscorts);
router.post('/escorts', authenticate, authorize('security_officer', 'admin'), securityController.assignEscort);

// GET /security/analytics — Threat & security screening analytics
router.get('/analytics', authenticate, authorize('security_officer', 'admin', 'manager'), securityController.getAnalytics);

module.exports = router;

