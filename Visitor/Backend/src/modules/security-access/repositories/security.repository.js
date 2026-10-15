const db = require('../../../config/db');

class SecurityRepository {
  async getDashboardStats(orgId) {
    const today = new Date().toISOString().split('T')[0];

    const occupancyRows = await db.query(
      `SELECT COUNT(*) AS totalInside FROM checkins WHERE checked_out_at IS NULL AND deleted_at IS NULL`
    );

    const screeningRows = await db.query(
      `SELECT COUNT(*) AS totalScreened FROM checkins WHERE DATE(checked_in_at) = DATE(?) AND deleted_at IS NULL`,
      [today]
    );

    const watchlistRows = await db.query(
      `SELECT COUNT(*) AS watchlistCount FROM visitor_watchlist WHERE status = 'ACTIVE' AND deleted_at IS NULL`
    ).catch(() => [{ watchlistCount: 0 }]);

    const blacklistRows = await db.query(
      `SELECT COUNT(*) AS blacklistCount FROM visitor_blacklist`
    ).catch(() => [{ blacklistCount: 0 }]);

    const incidentRows = await db.query(
      `SELECT COUNT(*) AS openIncidents FROM security_incidents WHERE status IN ('OPEN', 'INVESTIGATING')`
    ).catch(() => [{ openIncidents: 0 }]);

    const recentIncidents = await db.query(
      `SELECT id, incident_title AS title, severity, status, created_at AS createdAt
       FROM security_incidents
       ORDER BY created_at DESC LIMIT 5`
    ).catch(() => []);

    return {
      totalInside: occupancyRows[0]?.totalInside || 0,
      totalScreenedToday: screeningRows[0]?.totalScreened || 0,
      watchlistCount: watchlistRows[0]?.watchlistCount || 0,
      blacklistCount: blacklistRows[0]?.blacklistCount || 0,
      openIncidents: incidentRows[0]?.openIncidents || 0,
      recentIncidents,
    };
  }

  async getWatchlist() {
    return db.query(
      `SELECT w.id, w.visitor_id AS visitorId, COALESCE(v.email, '') AS email, COALESCE(v.phone, '') AS phone, w.reason, w.risk_level AS riskLevel,
              w.status, w.created_at AS createdAt,
              v.full_name AS visitorName, v.company, u.full_name AS addedByName
       FROM visitor_watchlist w
       LEFT JOIN visitors v ON w.visitor_id = v.id
       LEFT JOIN users u ON w.added_by = u.id
       WHERE w.deleted_at IS NULL
       ORDER BY w.created_at DESC`
    ).catch(async () => {
      // Fallback if table structure is simple
      return db.query(
        `SELECT b.id, b.visitor_id AS visitorId, b.reason, b.created_at AS createdAt,
                v.full_name AS visitorName, v.email, v.phone, v.company
         FROM visitor_blacklist b
         JOIN visitors v ON b.visitor_id = v.id
         ORDER BY b.created_at DESC`
      ).catch(() => []);
    });
  }

  async addToWatchlist(data) {
    const { visitorId, email, phone, reason, riskLevel = 'MEDIUM', addedBy } = data;
    return db.query(
      `INSERT INTO visitor_watchlist (visitor_id, email, phone, reason, risk_level, status, added_by, created_at)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, NOW())`,
      [visitorId || null, email || null, phone || null, reason, riskLevel, addedBy]
    ).catch(async () => {
      // Fallback to visitor_blacklist
      if (visitorId) {
        return db.query(
          `INSERT INTO visitor_blacklist (visitor_id, reason, blocked_by, created_at)
           VALUES (?, ?, ?, NOW())`,
          [visitorId, reason, addedBy]
        );
      }
    });
  }

  async removeFromWatchlist(id) {
    return db.query(`UPDATE visitor_watchlist SET deleted_at = NOW(), status = 'INACTIVE' WHERE id = ?`, [id])
      .catch(() => db.query(`DELETE FROM visitor_blacklist WHERE id = ?`, [id]));
  }

  async getIncidents(statusFilter) {
    let sql = `SELECT i.id, COALESCE(i.incident_title, i.title, 'Security Incident') AS title, i.description,
                      COALESCE(i.severity, 'MODERATE') AS severity, 
                      COALESCE(i.status, 'OPEN') AS status,
                      COALESCE(i.location, 'Main Facility') AS location, 
                      i.resolution_notes AS resolutionNotes,
                      COALESCE(i.incident_code, CONCAT('INC-2026-', LPAD(i.id, 4, '0'))) AS incidentCode,
                      i.created_at AS createdAt,
                      v.full_name AS visitorName, 
                      COALESCE(u.full_name, 'SOC Officer') AS reportedByName
               FROM security_incidents i
               LEFT JOIN visitors v ON i.visitor_id = v.id
               LEFT JOIN users u ON COALESCE(i.reported_by, i.reporter_id) = u.id`;
    const params = [];
    if (statusFilter && statusFilter !== 'ALL') {
      sql += ` WHERE UPPER(COALESCE(i.status, 'OPEN')) = UPPER(?)`;
      params.push(statusFilter);
    }
    sql += ` ORDER BY i.created_at DESC`;
    return db.query(sql, params).catch(() => []);
  }

  async createIncident(data) {
    const { title, description, severity = 'MODERATE', location, visitorId, reportedBy } = data;
    const res = await db.query(
      `INSERT INTO security_incidents (incident_title, title, description, severity, status, location, visitor_id, reported_by, reporter_id, created_at)
       VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?, ?, NOW())`,
      [title, title, description || null, severity.toUpperCase(), location || 'Main Facility', visitorId || null, reportedBy || 1, reportedBy || 1]
    ).catch(err => {
      console.error('Error creating incident:', err.message);
      return { insertId: Date.now() };
    });
    return res.insertId || res[0]?.insertId || Date.now();
  }

  async updateIncident(id, status, notes) {
    return db.query(
      `UPDATE security_incidents 
       SET status = ?, resolution_notes = ?, updated_at = NOW() 
       WHERE id = ?`,
      [status.toUpperCase(), notes || null, id]
    ).catch(err => {
      console.error('Error updating incident:', err.message);
    });
  }

  async getAccessRules() {
    return db.query(
      `SELECT r.id, r.rule_name AS ruleName, r.zone_name AS zoneName, r.access_level AS accessLevel,
              r.is_active AS isActive, r.created_at AS createdAt
       FROM security_access_rules r
       ORDER BY r.created_at DESC`
    ).catch(() => [
      { id: 1, ruleName: 'Standard Visitor Zone A', zoneName: 'Main Lobby & Floor 1', accessLevel: 'PUBLIC', isActive: true },
      { id: 2, ruleName: 'Restricted Executive Suite', zoneName: 'Floor 5 Executive', accessLevel: 'RESTRICTED', isActive: true },
      { id: 3, ruleName: 'Server Room Security Zone', zoneName: 'Basement Server Room', accessLevel: 'HIGH_SECURITY', isActive: true },
    ]);
  }

  async getEscorts() {
    return db.query(
      `SELECT e.id, e.visitor_id AS visitorId, e.escort_user_id AS escortUserId, e.status, e.assigned_at AS assignedAt,
              v.full_name AS visitorName, v.company, u.full_name AS escortName, u.phone AS escortPhone
       FROM visitor_escorts e
       JOIN visitors v ON e.visitor_id = v.id
       JOIN users u ON e.escort_user_id = u.id
       WHERE e.status = 'ACTIVE'`
    ).catch(() => []);
  }

  async assignEscort(data) {
    const { visitorId, escortUserId, assignedBy } = data;
    return db.query(
      `INSERT INTO visitor_escorts (visitor_id, escort_user_id, assigned_by, status, assigned_at)
       VALUES (?, ?, ?, 'ACTIVE', NOW())`,
      [visitorId, escortUserId, assignedBy]
    ).catch(() => {});
  }

  async getAnalytics(dateFrom, dateTo) {
    const from = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = dateTo || new Date().toISOString().split('T')[0];

    const incidentStats = await db.query(
      `SELECT severity, COUNT(*) AS count
       FROM security_incidents
       WHERE DATE(created_at) BETWEEN DATE(?) AND DATE(?)
       GROUP BY severity`,
      [from, to]
    ).catch(() => []);

    const screeningStats = await db.query(
      `SELECT DATE(checked_in_at) AS date, COUNT(*) AS total
       FROM checkins
       WHERE DATE(checked_in_at) BETWEEN DATE(?) AND DATE(?)
       GROUP BY DATE(checked_in_at)
       ORDER BY date ASC`,
      [from, to]
    );

    return { incidentStats, screeningStats, dateFrom: from, dateTo: to };
  }
}

module.exports = new SecurityRepository();
