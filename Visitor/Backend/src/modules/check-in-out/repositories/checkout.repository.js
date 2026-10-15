const db = require('../../../config/db');

class CheckoutRepository {
  async getDashboardStats(orgId, date) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const rows = await db.query(
      `SELECT
        COUNT(CASE WHEN DATE(c.checked_out_at) = DATE(?) THEN 1 END) AS checkedOutToday,
        COUNT(CASE WHEN c.checked_out_at IS NULL THEN 1 END) AS currentlyInside,
        AVG(CASE WHEN c.checked_out_at IS NOT NULL AND DATE(c.checked_out_at) = DATE(?)
              THEN TIMESTAMPDIFF(MINUTE, c.checked_in_at, c.checked_out_at) END) AS avgVisitDuration
       FROM checkins c
       WHERE c.deleted_at IS NULL`,
      [targetDate, targetDate]
    );

    const overstayRows = await db.query(
      `SELECT COUNT(*) AS overstayCount
       FROM checkins c
       JOIN appointments a ON c.appointment_id = a.id
       WHERE c.checked_out_at IS NULL
         AND c.deleted_at IS NULL
         AND NOW() > DATE_ADD(a.scheduled_end, INTERVAL 30 MINUTE)`
    );

    const hourlyRows = await db.query(
      `SELECT HOUR(c.checked_out_at) AS hour, COUNT(*) AS count
       FROM checkins c
       WHERE DATE(c.checked_out_at) = DATE(?) AND c.deleted_at IS NULL
       GROUP BY HOUR(c.checked_out_at)
       ORDER BY hour ASC`,
      [targetDate]
    );

    const methodRows = await db.query(
      `SELECT IFNULL(vc.checkout_method, 'MANUAL') AS method, COUNT(*) AS count
       FROM visitor_checkouts vc
       WHERE DATE(vc.checkout_time) = DATE(?) AND vc.is_active = TRUE
       GROUP BY vc.checkout_method`,
      [targetDate]
    );

    return {
      ...rows[0],
      overstayCount: overstayRows[0]?.overstayCount || 0,
      hourlyDistribution: hourlyRows,
      byMethod: methodRows,
    };
  }

  async getPendingCheckouts(filters = {}) {
    const { search } = filters;
    const conditions = ['c.checked_out_at IS NULL', 'c.deleted_at IS NULL'];
    const params = [];

    if (search) {
      const cleanSearch = String(search).trim();
      const numSearch = parseInt(cleanSearch.replace(/^#/, ''), 10);
      const validNum = !isNaN(numSearch) ? numSearch : -1;
      const term = `%${cleanSearch}%`;

      conditions.push(`(
        v.full_name LIKE ? 
        OR a.reference_code LIKE ? 
        OR a.appointment_number LIKE ? 
        OR c.badge_number LIKE ? 
        OR v.company LIKE ?
        OR v.phone LIKE ?
        OR v.email LIKE ?
        OR v.visitor_code LIKE ?
        OR v.id_number LIKE ?
        OR u.full_name LIKE ?
        OR vp.pass_code LIKE ?
        OR c.id = ?
        OR v.id = ?
        OR a.id = ?
      )`);
      params.push(
        term, term, term, term, term, term, term, term, term, term, term,
        validNum, validNum, validNum
      );
    }

    const whereClause = conditions.join(' AND ');

    return db.query(
      `SELECT c.id AS checkinId, c.checked_in_at AS checkedInAt, c.badge_number AS badgeNumber,
              c.is_walk_in AS isWalkIn, c.notes,
              TIMESTAMPDIFF(MINUTE, c.checked_in_at, NOW()) AS minutesInside,
              v.id AS visitorId, v.full_name AS visitorName, v.email AS visitorEmail,
              v.phone AS visitorPhone, v.company AS visitorCompany, v.photo_url AS photoUrl,
              a.id AS appointmentId, a.reference_code AS referenceCode, a.appointment_number AS appointmentNumber,
              a.scheduled_start AS scheduledStart, a.scheduled_end AS scheduledEnd,
              a.purpose, u.id AS hostId, u.full_name AS hostName, COALESCE(d.department_name, d.name, '') AS department,
              vp.id AS passId, vp.pass_code AS passCode,
              CASE WHEN a.scheduled_end IS NOT NULL AND NOW() > DATE_ADD(a.scheduled_end, INTERVAL 30 MINUTE) THEN TRUE ELSE FALSE END AS isOverstay,
              GREATEST(0, CASE WHEN a.scheduled_end IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, DATE_ADD(a.scheduled_end, INTERVAL 30 MINUTE), NOW()) ELSE 0 END) AS overstayMinutes
       FROM checkins c
       JOIN visitors v ON c.visitor_id = v.id
       LEFT JOIN appointments a ON c.appointment_id = a.id
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN visitor_passes vp ON c.pass_id = vp.id
       WHERE ${whereClause}
       ORDER BY c.checked_in_at ASC`,
      params
    );
  }

  async getOverstayRecords() {
    return db.query(
      `SELECT c.id AS checkinId, c.checked_in_at AS checkedInAt, c.badge_number AS badgeNumber,
              TIMESTAMPDIFF(MINUTE, c.checked_in_at, NOW()) AS minutesInside,
              v.id AS visitorId, v.full_name AS visitorName, v.email AS visitorEmail,
              v.phone AS visitorPhone, v.company AS visitorCompany,
              a.id AS appointmentId, a.reference_code AS referenceCode,
              a.scheduled_start AS scheduledStart, a.scheduled_end AS scheduledEnd,
              u.id AS hostId, u.full_name AS hostName, u.email AS hostEmail,
              d.department_name AS department,
              GREATEST(0, TIMESTAMPDIFF(MINUTE, a.scheduled_end, NOW())) AS overstayMinutes
       FROM checkins c
       JOIN visitors v ON c.visitor_id = v.id
       JOIN appointments a ON c.appointment_id = a.id
       JOIN users u ON a.host_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE c.checked_out_at IS NULL
         AND c.deleted_at IS NULL
         AND NOW() > a.scheduled_end
       ORDER BY overstayMinutes DESC`
    );
  }

  async getEvacuationRollCall() {
    return db.query(
      `SELECT c.id AS checkinId, c.checked_in_at AS checkedInAt, c.badge_number AS badgeNumber,
              v.id AS visitorId, v.full_name AS visitorName, v.phone AS visitorPhone, v.company AS visitorCompany,
              u.full_name AS hostName, u.phone AS hostPhone, d.department_name AS department,
              TIMESTAMPDIFF(MINUTE, c.checked_in_at, NOW()) AS minutesInside
       FROM checkins c
       JOIN visitors v ON c.visitor_id = v.id
       LEFT JOIN appointments a ON c.appointment_id = a.id
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE c.checked_out_at IS NULL AND c.deleted_at IS NULL
       ORDER BY d.department_name ASC, v.full_name ASC`
    );
  }

  async getCheckoutHistory(filters = {}, pagination = {}) {
    const { dateFrom, dateTo, checkoutMethod, search } = filters;
    const page = Math.max(1, parseInt(pagination.page) || 1);
    const limit = Math.min(100, parseInt(pagination.limit) || 20);
    const offset = (page - 1) * limit;

    const conditions = ['vc.is_active = TRUE'];
    const params = [];

    if (dateFrom) { conditions.push('DATE(vc.checkout_time) >= DATE(?)'); params.push(dateFrom); }
    if (dateTo)   { conditions.push('DATE(vc.checkout_time) <= DATE(?)'); params.push(dateTo); }
    if (checkoutMethod) { conditions.push('vc.checkout_method = ?'); params.push(checkoutMethod); }
    if (search) {
      conditions.push('(v.full_name LIKE ? OR a.reference_code LIKE ? OR c.badge_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    const countRows = await db.query(
      `SELECT COUNT(*) AS total
       FROM visitor_checkouts vc
       LEFT JOIN checkins c ON vc.checkin_id = c.id
       LEFT JOIN visitors v ON vc.visitor_id = v.id
       LEFT JOIN appointments a ON vc.appointment_id = a.id
       WHERE ${whereClause}`,
      params
    );

    const rows = await db.query(
      `SELECT vc.id, vc.checkout_time AS checkoutTime, vc.checkout_method AS checkoutMethod,
              vc.total_visit_duration AS totalVisitDuration, vc.remarks,
              c.checked_in_at AS checkedInAt, c.badge_number AS badgeNumber, c.is_walk_in AS isWalkIn,
              v.id AS visitorId, v.full_name AS visitorName, v.email AS visitorEmail,
              v.phone AS visitorPhone, v.company AS visitorCompany, v.photo_url AS photoUrl,
              a.id AS appointmentId, a.reference_code AS referenceCode, a.purpose,
              u.full_name AS hostName, d.department_name AS department,
              r.full_name AS receptionistName
       FROM visitor_checkouts vc
       LEFT JOIN checkins c ON vc.checkin_id = c.id
       LEFT JOIN visitors v ON vc.visitor_id = v.id
       LEFT JOIN appointments a ON vc.appointment_id = a.id
       LEFT JOIN users u ON vc.host_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN users r ON vc.receptionist_id = r.id
       WHERE ${whereClause}
       ORDER BY vc.checkout_time DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: rows,
      pagination: { page, limit, total: countRows[0]?.total || 0, pages: Math.ceil((countRows[0]?.total || 0) / limit) },
    };
  }

  async getAnalytics(dateFrom, dateTo) {
    const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = dateTo || new Date().toISOString().split('T')[0];

    const daily = await db.query(
      `SELECT DATE(vc.checkout_time) AS date,
              COUNT(*) AS total,
              AVG(vc.total_visit_duration) AS avgDuration
       FROM visitor_checkouts vc
       WHERE DATE(vc.checkout_time) BETWEEN DATE(?) AND DATE(?) AND vc.is_active = TRUE
       GROUP BY DATE(vc.checkout_time)
       ORDER BY date ASC`,
      [from, to]
    );

    const hourly = await db.query(
      `SELECT HOUR(vc.checkout_time) AS hour, COUNT(*) AS count
       FROM visitor_checkouts vc
       WHERE DATE(vc.checkout_time) BETWEEN DATE(?) AND DATE(?) AND vc.is_active = TRUE
       GROUP BY HOUR(vc.checkout_time)
       ORDER BY hour ASC`,
      [from, to]
    );

    const summary = await db.query(
      `SELECT
        COUNT(*) AS totalCheckouts,
        AVG(vc.total_visit_duration) AS avgDuration
       FROM visitor_checkouts vc
       WHERE DATE(vc.checkout_time) BETWEEN DATE(?) AND DATE(?) AND vc.is_active = TRUE`,
      [from, to]
    );

    return { daily, hourly, summary: summary[0], dateFrom: from, dateTo: to };
  }

  async findActiveCheckinByCode(code) {
    if (!code) return null;
    const cleanCode = String(code).trim().replace(/^#/, '');
    const numId = parseInt(cleanCode, 10);
    const validNum = !isNaN(numId) ? numId : -1;
    const term = `%${cleanCode}%`;

    const rows = await db.query(
      `SELECT c.id AS checkinId, c.visitor_id AS visitorId, c.appointment_id AS appointmentId,
              c.pass_id AS passId, c.checked_in_at AS checkedInAt, c.badge_number AS badgeNumber,
              v.full_name AS visitorName, v.email AS visitorEmail, v.phone AS visitorPhone,
              v.company AS visitorCompany, v.photo_url AS photoUrl,
              a.reference_code AS referenceCode, a.appointment_number AS appointmentNumber,
              a.host_id AS hostId,
              u.full_name AS hostName
       FROM checkins c
       JOIN visitors v ON c.visitor_id = v.id
       LEFT JOIN appointments a ON c.appointment_id = a.id
       LEFT JOIN users u ON a.host_id = u.id
       LEFT JOIN visitor_passes vp ON c.pass_id = vp.id
       WHERE c.checked_out_at IS NULL
         AND c.deleted_at IS NULL
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
         )
       ORDER BY c.id DESC
       LIMIT 1`,
      [cleanCode, cleanCode, cleanCode, cleanCode, cleanCode, validNum, validNum, validNum, cleanCode, cleanCode, cleanCode, cleanCode, term]
    );
    return rows[0] || null;
  }
}

module.exports = new CheckoutRepository();
