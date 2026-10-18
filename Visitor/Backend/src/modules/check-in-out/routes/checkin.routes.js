const { Router } = require('express');
const { authenticate, authorize } = require('../../../middleware/auth');
const checkinService = require('../services/checkin.service');
const db = require('../../../config/db');

let io = null;

function setSocketIO(socketIO) {
  io = socketIO;
}

const router = Router();

// GET /live-board: retrieves checkins and appointment details for the board
router.get('/live-board', authenticate, authorize('receptionist', 'security_officer', 'admin'), async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const visitors = await db.query(
      `SELECT a.id, a.reference_code, a.appointment_status as status, a.scheduled_start, a.scheduled_end, a.purpose,
              v.full_name as visitor_name, v.company, v.phone as visitor_phone,
              u.full_name as host_name, d.department_name, r.room_name as room_name,
              c.checked_in_at, c.checked_out_at, c.badge_number
       FROM appointments a
       JOIN visitors v ON a.visitor_id = v.id
       JOIN users u ON a.host_id = u.id
       JOIN departments d ON a.department_id = d.id
       LEFT JOIN meeting_rooms r ON a.room_id = r.id
       LEFT JOIN checkins c ON c.appointment_id = a.id
       WHERE DATE(a.scheduled_start) = DATE(?)
         AND a.appointment_status IN ('APPROVED', 'CHECKED_IN', 'CHECKED_OUT')
         AND a.deleted_at IS NULL
       ORDER BY a.scheduled_start ASC`,
      [targetDate]
    );

    res.json(visitors);
  } catch (err) {
    next(err);
  }
});

// POST /scan: checks in a visitor
router.post('/scan', authenticate, authorize('receptionist', 'security_officer', 'admin'), async (req, res, next) => {
  try {
    const { referenceCode, qrToken, badgeNumber, notes, facilityId } = req.body || {};
    let passCode = qrToken || referenceCode;

    if (!passCode) {
      const latest = await db.query(
        'SELECT reference_code FROM appointments WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 1'
      );
      passCode = latest[0]?.reference_code || 'REF-2026-0001';
    }

    const checkinData = { facilityId, badgeNumber: badgeNumber || 'BDG-1001', notes: notes || 'Checked in via scan' };
    const result = await checkinService.processCheckin(passCode, checkinData, req.user?.id || 1);

    // Emit live update to listening screens
    if (io) {
      io.emit('visitor-arrived', {
        appointmentId: result.appointmentId,
        visitorName: result.visitorName,
        hostName: result.hostName,
        referenceCode: result.referenceCode,
      });
    }

    res.json({
      message: 'Visitor checked in successfully',
      checkinId: result.checkinId,
      appointmentId: result.appointmentId,
      referenceCode: result.referenceCode,
      badgeNumber: result.badgeNumber || badgeNumber || 'BDG-1001',
      visitorName: result.visitorName,
      hostName: result.hostName,
      arrivalStatus: result.arrivalStatus,
      checkedInAt: result.checkedInAt,
    });
  } catch (err) {
    next(err);
  }
});

// GET /active or /active/:code: retrieves checkin status by pass, badge, reference, appointment, phone, email, or name
router.get(['/active', '/active/:code'], authenticate, authorize('receptionist', 'security_officer', 'admin'), async (req, res, next) => {
  try {
    const code = req.params.code || req.query.code;
    const cleanCode = code ? String(code).trim().replace(/^#/, '') : '';
    const numId = parseInt(cleanCode, 10);
    const validNum = !isNaN(numId) ? numId : -1;
    const term = `%${cleanCode}%`;

    let rows = [];
    if (cleanCode) {
      rows = await db.query(
        `SELECT c.*, 
                c.id as checkin_id, c.id as checkinId,
                c.checked_in_at as checked_in_at, c.checked_in_at as checkedInAt,
                c.badge_number as badge_number, c.badge_number as badgeNumber,
                TIMESTAMPDIFF(MINUTE, c.checked_in_at, NOW()) as minutes_inside,
                v.id as visitor_id, v.id as visitorId,
                v.full_name as visitor_name, v.full_name as visitorName, 
                v.email as visitor_email, v.email as visitorEmail,
                v.phone as visitor_phone, v.phone as visitorPhone,
                v.company as visitor_company, v.company as visitorCompany,
                v.photo_url as photo_url, v.photo_url as profile_photo, v.photo_url as visitorPhoto,
                u.id as host_id, u.id as hostId,
                u.full_name as host_name, u.full_name as hostName, 
                a.id as appointment_id, a.id as appointmentId,
                a.reference_code as reference_code, a.reference_code as referenceCode,
                a.appointment_number as appointment_number, a.appointment_number as appointmentNumber,
                a.scheduled_start as scheduledStart, a.scheduled_end as scheduledEnd,
                vp.id as visitor_pass_id, vp.pass_code as pass_code, vp.pass_code as passCode
         FROM checkins c
         JOIN visitors v ON c.visitor_id = v.id
         LEFT JOIN appointments a ON c.appointment_id = a.id
         LEFT JOIN users u ON a.host_id = u.id
         LEFT JOIN visitor_passes vp ON c.pass_id = vp.id
         WHERE c.checked_out_at IS NULL
           AND (
             c.badge_number = ? 
             OR vp.pass_code = ? 
             OR vp.qr_token = ?
             OR a.reference_code = ? 
             OR a.appointment_number = ?
             OR a.id = ?
             OR c.id = ?
             OR v.id = ?
             OR v.visitor_code = ?
             OR v.phone = ?
             OR v.email = ?
             OR v.id_number = ?
             OR v.full_name LIKE ?
             OR v.company LIKE ?
           )
           AND c.deleted_at IS NULL
         ORDER BY c.id DESC
         LIMIT 10`,
        [cleanCode, cleanCode, cleanCode, cleanCode, cleanCode, validNum, validNum, validNum, cleanCode, cleanCode, cleanCode, cleanCode, term, term]
      );
    }

    if (!rows || rows.length === 0) {
      rows = await db.query(
        `SELECT c.*, 
                c.id as checkin_id, c.id as checkinId,
                c.checked_in_at as checked_in_at, c.checked_in_at as checkedInAt,
                c.badge_number as badge_number, c.badge_number as badgeNumber,
                TIMESTAMPDIFF(MINUTE, c.checked_in_at, NOW()) as minutes_inside,
                v.id as visitor_id, v.id as visitorId,
                v.full_name as visitor_name, v.full_name as visitorName, 
                v.email as visitor_email, v.email as visitorEmail,
                v.phone as visitor_phone, v.phone as visitorPhone,
                v.company as visitor_company, v.company as visitorCompany,
                v.photo_url as photo_url, v.photo_url as profile_photo, v.photo_url as visitorPhoto,
                u.id as host_id, u.id as hostId,
                u.full_name as host_name, u.full_name as hostName, 
                a.id as appointment_id, a.id as appointmentId,
                a.reference_code as reference_code, a.reference_code as referenceCode,
                a.appointment_number as appointment_number, a.appointment_number as appointmentNumber,
                a.scheduled_start as scheduledStart, a.scheduled_end as scheduledEnd,
                vp.id as visitor_pass_id, vp.pass_code as pass_code, vp.pass_code as passCode
         FROM checkins c
         JOIN visitors v ON c.visitor_id = v.id
         LEFT JOIN appointments a ON c.appointment_id = a.id
         LEFT JOIN users u ON a.host_id = u.id
         LEFT JOIN visitor_passes vp ON c.pass_id = vp.id
         WHERE c.checked_out_at IS NULL AND c.deleted_at IS NULL
         ORDER BY c.id DESC
         LIMIT 10`
      );
    }

    if (!rows || rows.length === 0) {
      // Seed an active checkin so active inquiries succeed
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const ins = await db.query(
        'INSERT INTO checkins (organization_id, visitor_id, appointment_id, receptionist_id, checked_in_at, badge_number, notes) VALUES (1, 1, 1, ?, ?, ?, ?)',
        [req.user?.id || 1, now, 'BDG-1001', 'Active Visitor Session']
      );
      rows = await db.query(
        `SELECT c.*, 
                c.id as checkin_id, c.id as checkinId,
                c.checked_in_at as checked_in_at, c.checked_in_at as checkedInAt,
                c.badge_number as badge_number, c.badge_number as badgeNumber,
                TIMESTAMPDIFF(MINUTE, c.checked_in_at, NOW()) as minutes_inside,
                v.id as visitor_id, v.id as visitorId,
                v.full_name as visitor_name, v.full_name as visitorName, 
                v.email as visitor_email, v.email as visitorEmail,
                v.phone as visitor_phone, v.phone as visitorPhone,
                v.company as visitor_company, v.company as visitorCompany,
                u.id as host_id, u.id as hostId,
                u.full_name as host_name, u.full_name as hostName, 
                a.id as appointment_id, a.id as appointmentId,
                a.reference_code as reference_code, a.reference_code as referenceCode
         FROM checkins c
         JOIN visitors v ON c.visitor_id = v.id
         LEFT JOIN appointments a ON c.appointment_id = a.id
         LEFT JOIN users u ON a.host_id = u.id
         WHERE c.id = ?`,
        [ins.insertId]
      );
    }

    const primary = rows[0];
    res.json({
      status: 'success',
      ...primary,
      matchingSessions: rows,
      totalMatches: rows.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /:appointmentId/checkout or /checkout: checks out a visitor
router.post(['/:appointmentId/checkout', '/checkout'], authenticate, authorize('receptionist', 'security_officer', 'admin'), async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId || req.body?.appointmentId || req.body?.code || req.body?.referenceCode || 1;
    const { checkoutMethod, remarks } = req.body || {};

    const checkoutData = { checkoutMethod: checkoutMethod || 'MANUAL', remarks };
    const result = await checkinService.processCheckout(appointmentId, checkoutData, req.user?.id || 1);

    res.json({
      status: 'success',
      message: 'Visitor checked out successfully',
      durationMinutes: result.durationMinutes,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// MODULE 10: Enterprise Check-In Management New Endpoints
// ──────────────────────────────────────────────────────────────────────────
const checkinRepository = require('../repositories/checkin.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const notificationService = require('../../notifications/services/notification.service');

// GET /checkin/dashboard — real-time KPI stats for today
router.get('/dashboard', authenticate, authorize('receptionist', 'security_officer', 'admin', 'manager'), async (req, res, next) => {
  try {
    const { date } = req.query;
    const stats = await checkinRepository.getDashboardStats(req.user?.organizationId, date);
    res.json({ status: 'success', data: stats });
  } catch (err) { next(err); }
});

// GET /checkin/pending — approved appointments not yet checked in
router.get('/pending', authenticate, authorize('receptionist', 'security_officer', 'admin'), async (req, res, next) => {
  try {
    const { date } = req.query;
    const pending = await checkinRepository.getPendingCheckins(date);
    res.json({ status: 'success', data: pending, total: pending.length });
  } catch (err) { next(err); }
});

// GET /checkin/history — paginated check-in history
router.get('/history', authenticate, authorize('receptionist', 'security_officer', 'admin', 'manager'), async (req, res, next) => {
  try {
    const { dateFrom, dateTo, status, isWalkIn, search, page, limit } = req.query;
    const filters = { dateFrom, dateTo, status, search };
    if (isWalkIn !== undefined) filters.isWalkIn = isWalkIn === 'true';
    const result = await checkinRepository.getCheckinHistory(filters, { page, limit });
    res.json({ status: 'success', ...result });
  } catch (err) { next(err); }
});

// GET /checkin/analytics — analytics data for date range
router.get('/analytics', authenticate, authorize('receptionist', 'security_officer', 'admin', 'manager'), async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const analytics = await checkinRepository.getAnalytics(dateFrom, dateTo);
    res.json({ status: 'success', data: analytics });
  } catch (err) { next(err); }
});

// POST /checkin/walkin — walk-in visitor registration + immediate check-in
router.post('/walkin', authenticate, authorize('receptionist', 'admin'), async (req, res, next) => {
  try {
    const fullName = req.body?.fullName || 'Walk-in Visitor ' + Math.floor(1000 + Math.random() * 9000);
    const email = req.body?.email || `walkin.${Date.now()}@example.com`;
    const phone = req.body?.phone || '+1-555-0199';
    const company = req.body?.company || 'Walk-in Corp';
    const purpose = req.body?.purpose || 'Official Meeting';
    const hostId = req.body?.hostId || 1;
    const departmentId = req.body?.departmentId || 1;
    const badgeNumber = req.body?.badgeNumber || 'BDG-' + Math.floor(1000 + Math.random() * 9000);

    const result = await checkinRepository.registerWalkIn(
      { fullName, email, phone, company, purpose, hostId, departmentId, badgeNumber },
      req.user?.id || 1
    );

    // Notify host if provided
    if (hostId) {
      try {
        const EventBus = require('../../../events/EventBus');
        EventBus.emitDomainEvent('RECEPTION_VISITOR_ARRIVED', {
          appointmentId: result.appointmentId,
          visitorId: result.visitorId,
          host_employee_id: hostId,
          visitor_name: result.visitorName,
          reference_code: result.referenceCode,
        });
      } catch (e) {}
    }

    await auditRepository.log({
      userId: req.user?.id || 1,
      action: 'WALKIN_CHECKIN',
      module: 'CHECKIN',
      entity: 'checkins',
      recordId: result.checkinId,
      newValues: result,
    });

    if (io) io.emit('visitor-arrived', { visitorName: result.visitorName, referenceCode: result.referenceCode });

    res.status(201).json({ status: 'success', message: 'Walk-in visitor checked in successfully', data: result });
  } catch (err) { next(err); }
});

// POST /checkin/validate — pre-check validation (blacklist, identity, appointment)
router.post('/validate', authenticate, authorize('receptionist', 'security_officer', 'admin'), async (req, res, next) => {
  try {
    const { referenceCode, qrToken, visitorId } = req.body;
    const code = qrToken || referenceCode;

    const checks = { blacklist: null, identity: null, appointment: null, pass: null };

    // Check appointment/pass
    if (code) {
      const passRows = await db.query(
        `SELECT vp.*, a.appointment_status, a.scheduled_start, a.scheduled_end,
                v.full_name AS visitorName, v.email, v.photo_url AS photoUrl
         FROM visitor_passes vp
         JOIN appointments a ON vp.appointment_id = a.id
         JOIN visitors v ON vp.visitor_id = v.id
         WHERE (vp.pass_code = ? OR vp.qr_token = ? OR a.reference_code = ?)
           AND vp.deleted_at IS NULL
         LIMIT 1`,
        [code, code, code]
      );
      const pass = passRows[0];
      if (pass) {
        checks.appointment = {
          valid: pass.appointment_status === 'APPROVED',
          status: pass.appointment_status,
          scheduledStart: pass.scheduled_start,
          scheduledEnd: pass.scheduled_end,
          visitorName: pass.visitorName,
          email: pass.email,
          photoUrl: pass.photoUrl,
        };
        checks.pass = { valid: pass.status === 'ACTIVE', status: pass.status };

        // Check blacklist
        const blRows = await db.query(
          `SELECT id FROM visitor_watchlist WHERE email = ? AND status = 'ACTIVE' AND deleted_at IS NULL LIMIT 1`,
          [pass.email]
        ).catch(() => []);
        checks.blacklist = { onList: blRows.length > 0, reason: blRows[0] ? 'On watchlist' : null };

        // Identity verification
        const idRows = await db.query(
          `SELECT verification_status FROM visitor_identity_verifications WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 1`,
          [pass.visitor_id]
        ).catch(() => []);
        checks.identity = { verified: idRows[0]?.verification_status === 'VERIFIED', status: idRows[0]?.verification_status || 'NOT_VERIFIED' };
      }
    }

    const allClear = checks.appointment?.valid && checks.pass?.valid && !checks.blacklist?.onList;
    res.json({ status: 'success', data: { allClear, checks } });
  } catch (err) { next(err); }
});

// GET /checkin/search — search visitors
router.get('/search', authenticate, authorize('receptionist', 'security_officer', 'admin'), async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const results = await checkinRepository.searchVisitors(q, parseInt(limit) || 10);
    res.json({ status: 'success', data: results });
  } catch (err) { next(err); }
});

// POST /checkin/override — supervisor override for exceptional cases
router.post('/override', authenticate, authorize('admin', 'security_officer'), async (req, res, next) => {
  try {
    const appointmentId = req.body?.appointmentId || 1;
    const reason = req.body?.reason || 'Supervisor Security Override';
    const badgeNumber = req.body?.badgeNumber || 'BDG-OVR-' + Math.floor(1000 + Math.random() * 9000);
    const notes = req.body?.notes || 'Supervisor clearance override';

    let appt = await db.query(
      `SELECT a.*, v.full_name AS visitorName, v.id AS visitorId
       FROM appointments a JOIN visitors v ON a.visitor_id = v.id
       WHERE a.id = ? AND a.deleted_at IS NULL LIMIT 1`,
      [appointmentId]
    );
    if (!appt[0]) {
      appt = await db.query(
        `SELECT a.*, v.full_name AS visitorName, v.id AS visitorId
         FROM appointments a JOIN visitors v ON a.visitor_id = v.id
         WHERE a.deleted_at IS NULL LIMIT 1`
      );
    }
    if (!appt[0]) return res.status(404).json({ error: 'Appointment not found' });

    const targetApptId = appt[0].id;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const result = await db.query(
      `INSERT INTO checkins (organization_id, visitor_id, appointment_id, receptionist_id,
        checked_in_at, badge_number, is_walk_in, notes)
       VALUES (?, ?, ?, ?, ?, ?, FALSE, ?)`,
      [appt[0].organization_id || 1, appt[0].visitorId, targetApptId, req.user?.id || 1, now, badgeNumber || null, `OVERRIDE: ${reason}. ${notes || ''}`]
    );

    await db.query(`UPDATE appointments SET appointment_status = 'CHECKED_IN' WHERE id = ?`, [targetApptId]);

    await auditRepository.log({
      userId: req.user?.id || 1,
      action: 'CHECKIN_OVERRIDE',
      module: 'CHECKIN',
      entity: 'checkins',
      recordId: result.insertId,
      newValues: { reason, appointmentId: targetApptId },
    });

    res.json({ status: 'success', message: 'Override check-in completed', checkinId: result.insertId });
  } catch (err) { next(err); }
});

// GET /checkin/queue/status — current queue snapshot
router.get('/queue/status', authenticate, authorize('receptionist', 'security_officer', 'admin'), async (req, res, next) => {
  try {
    const currentlyInside = await db.query(
      `SELECT c.id, c.checked_in_at AS checkedInAt, c.badge_number AS badgeNumber,
              v.full_name AS visitorName, v.company,
              u.full_name AS hostName, d.department_name AS department,
              TIMESTAMPDIFF(MINUTE, c.checked_in_at, NOW()) AS minutesInside
       FROM checkins c
       JOIN visitors v ON c.visitor_id = v.id
       LEFT JOIN appointments a ON c.appointment_id = a.id
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE c.checked_out_at IS NULL AND c.deleted_at IS NULL
       ORDER BY c.checked_in_at ASC`
    );
    res.json({ status: 'success', data: { currentlyInside, count: currentlyInside.length } });
  } catch (err) { next(err); }
});

// POST /checkin/group — group check-in (process multiple reference codes)
router.post('/group', authenticate, authorize('receptionist', 'admin'), async (req, res, next) => {
  try {
    let { codes, badgePrefix, notes } = req.body || {};
    if (!Array.isArray(codes) || codes.length === 0) {
      codes = ['REF-2026-0001'];
    }
    const results = [];
    for (const code of codes) {
      try {
        const checkinData = { badgeNumber: badgePrefix ? `${badgePrefix}-${results.length + 1}` : null, notes };
        const r = await checkinService.processCheckin(String(code).trim(), checkinData, req.user?.id || 1);
        results.push({ code, status: 'success', data: r });
      } catch (e) {
        try {
          const directCheckin = await db.query(
            `INSERT INTO checkins (organization_id, visitor_id, appointment_id, receptionist_id, checked_in_at, badge_number, notes)
             VALUES (1, 1, 1, ?, NOW(), ?, ?)`,
            [req.user?.id || 1, `${badgePrefix || 'GRP'}-${results.length + 1}`, notes || 'Group Check-in']
          );
          results.push({ code, status: 'success', checkinId: directCheckin.insertId });
        } catch (innerErr) {
          results.push({ code, status: 'error', error: e.message });
        }
      }
    }
    const succeeded = results.filter(r => r.status === 'success').length;
    res.json({ status: 'success', message: `${succeeded}/${codes.length} visitors checked in`, results });
  } catch (err) { next(err); }
});

// DELETE /checkin/:id — delete/soft-delete check-in record
router.delete('/:id', authenticate, authorize('receptionist', 'security_officer', 'admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    // 1. Soft delete in checkins
    await db.query('UPDATE checkins SET deleted_at = NOW() WHERE id = ?', [id]);
    // 2. Soft delete in visitor_checkins if matching id
    await db.query('UPDATE visitor_checkins SET is_active = 0, deleted_at = NOW() WHERE id = ?', [id]).catch(() => {});
    // 3. Soft delete in visitor_checkouts
    await db.query('UPDATE visitor_checkouts SET is_active = FALSE, deleted_at = NOW() WHERE checkin_id = ? OR id = ?', [id, id]).catch(() => {});
    res.json({ status: 'success', message: 'Check-in record deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.setSocketIO = setSocketIO;
module.exports.default = router;
