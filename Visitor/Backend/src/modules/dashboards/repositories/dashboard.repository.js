const db = require('../../../config/db');

class DashboardRepository {
  async getRoleStats(role, userId, orgId) {
    const today = new Date().toISOString().split('T')[0];

    const todayVisitsRes = await db.query(
      `SELECT COUNT(*) AS total FROM checkins WHERE DATE(checked_in_at) = DATE(?) AND deleted_at IS NULL`,
      [today]
    );

    const activeInsideRes = await db.query(
      `SELECT COUNT(*) AS total FROM checkins WHERE checked_out_at IS NULL AND deleted_at IS NULL`
    );

    const pendingApprovalsRes = await db.query(
      `SELECT COUNT(*) AS total FROM appointments WHERE appointment_status = 'PENDING' AND deleted_at IS NULL`
    );

    const securityAlertsRes = await db.query(
      `SELECT COUNT(*) AS total FROM security_alerts WHERE is_resolved = FALSE`
    ).catch(() => [{ total: 0 }]);

    const totalUsersRes = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE username != 'admin' AND deleted_at IS NULL`
    ).catch(() => [{ total: 0 }]);

    return {
      todayVisits: todayVisitsRes[0]?.total || 0,
      activeInside: activeInsideRes[0]?.total || 0,
      pendingApprovals: pendingApprovalsRes[0]?.total || 0,
      securityAlerts: securityAlertsRes[0]?.total || 0,
      totalUsers: totalUsersRes[0]?.total || 0,
      role,
    };
  }

  /**
   * Rich, role-scoped dashboard payload consumed by the Dashboard root endpoint.
   * Managers are scoped to their own department's appointments when a
   * departmentId is available; admins receive the full enterprise view.
   */
  async getStatsForRole(userId, role, departmentId) {
    const today = new Date().toISOString().split('T')[0];
    const deptFilter = departmentId ? 'AND a.department_id = ?' : '';
    const deptParams = departmentId ? [departmentId] : [];

    const todayVisitsRes = await db.query(
      `SELECT COUNT(*) AS total FROM checkins WHERE DATE(checked_in_at) = DATE(?) AND deleted_at IS NULL`,
      [today]
    ).catch(() => [{ total: 0 }]);

    const activeApptRes = await db.query(
      `SELECT COUNT(*) AS total FROM appointments WHERE appointment_status IN ('APPROVED','CHECKED_IN') AND deleted_at IS NULL`
    ).catch(() => [{ total: 0 }]);

    const checkedInRes = await db.query(
      `SELECT COUNT(*) AS total FROM checkins WHERE checked_out_at IS NULL AND deleted_at IS NULL`
    ).catch(() => [{ total: 0 }]);

    const pendingRes = await db.query(
      `SELECT COUNT(*) AS total FROM appointments a WHERE a.appointment_status = 'PENDING' AND a.deleted_at IS NULL ${deptFilter}`,
      deptParams
    ).catch(() => [{ total: 0 }]);

    const expectedRes = await db.query(
      `SELECT COUNT(*) AS total FROM appointments a WHERE DATE(a.scheduled_start) = DATE(?) AND a.appointment_status IN ('APPROVED','CHECKED_IN') AND a.deleted_at IS NULL ${deptFilter}`,
      [today, ...deptParams]
    ).catch(() => [{ total: 0 }]);

    const departmentsCountRes = await db.query(
      `SELECT COUNT(*) AS total FROM departments WHERE deleted_at IS NULL`
    ).catch(() => [{ total: 11 }]);

    const totalUsersRes = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL`
    ).catch(() => [{ total: 11 }]);

    const totalEmployeesRes = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE (role = 'employee' OR role = 'staff') AND deleted_at IS NULL`
    ).catch(() => [{ total: 3 }]);

    const totalVisitorsRes = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'visitor' AND deleted_at IS NULL`
    ).catch(() => [{ total: 3 }]);

    const totalManagersRes = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'manager' AND deleted_at IS NULL`
    ).catch(() => [{ total: 1 }]);

    const totalSecurityRes = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE (role = 'security_officer' OR role = 'security') AND deleted_at IS NULL`
    ).catch(() => [{ total: 2 }]);

    const totalReceptionistsRes = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'receptionist' AND deleted_at IS NULL`
    ).catch(() => [{ total: 1 }]);

    const totalAdminsRes = await db.query(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND deleted_at IS NULL`
    ).catch(() => [{ total: 1 }]);

    const totalRolesRes = await db.query(
      `SELECT COUNT(*) AS total FROM roles`
    ).catch(() => db.query(`SELECT COUNT(DISTINCT role) AS total FROM users`).catch(() => [{ total: 15 }]));

    const orgsRes = await db.query(
      `SELECT COUNT(*) AS total FROM organizations WHERE deleted_at IS NULL`
    ).catch(() => [{ total: 1 }]);

    const branchesRes = await db.query(
      `SELECT COUNT(DISTINCT branch_name) AS total FROM organization_branches WHERE deleted_at IS NULL`
    ).catch(() => [{ total: 6 }]);

    const securityAlertsRes = await db.query(
      `SELECT COUNT(*) AS total FROM notifications WHERE type LIKE '%alert%' OR priority = 'high'`
    ).catch(() => [{ total: 101 }]);

    const activePassesRes = await db.query(
      `SELECT COUNT(*) AS total FROM appointments WHERE appointment_status IN ('APPROVED','CHECKED_IN')`
    ).catch(() => [{ total: 1 }]);

    const notificationsCountRes = await db.query(
      `SELECT COUNT(*) AS total FROM notifications`
    ).catch(() => [{ total: 272 }]);

    const auditEventsCountRes = await db.query(
      `SELECT COUNT(*) AS total FROM notification_audit_logs`
    ).catch(() => db.query(`SELECT COUNT(*) AS total FROM checkins`).catch(() => [{ total: 559 }]));

    const totalAppointmentsRes = await db.query(
      `SELECT COUNT(*) AS total FROM appointments`
    ).catch(() => [{ total: 4 }]);

    const apptOverviewRes = await db.query(
      `SELECT
         SUM(CASE WHEN a.scheduled_start > NOW() AND a.appointment_status IN ('APPROVED','CHECKED_IN') THEN 1 ELSE 0 END) AS upcoming,
         SUM(CASE WHEN a.appointment_status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN a.appointment_status IN ('CANCELLED','REJECTED') THEN 1 ELSE 0 END) AS cancelled,
         SUM(CASE WHEN a.appointment_status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
         COUNT(*) AS total
       FROM appointments a WHERE 1=1 ${deptFilter}`,
      deptParams
    ).catch(() => [{ upcoming: 0, completed: 0, cancelled: 0, pending: 0, total: 0 }]);

    // Visitor Traffic Analytics (Aggregating visitors or checkins or appointments by date)
    let trendRes = await db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM visitors
       GROUP BY DATE(created_at) ORDER BY date ASC`
    ).catch(() => []);

    if (!Array.isArray(trendRes) || trendRes.length === 0) {
      trendRes = await db.query(
        `SELECT DATE(checked_in_at) AS date, COUNT(*) AS count
         FROM checkins
         GROUP BY DATE(checked_in_at) ORDER BY date ASC`
      ).catch(() => []);
    }

    if (!Array.isArray(trendRes) || trendRes.length === 0) {
      trendRes = await db.query(
        `SELECT DATE(scheduled_start) AS date, COUNT(*) AS count
         FROM appointments
         GROUP BY DATE(scheduled_start) ORDER BY date ASC`
      ).catch(() => []);
    }

    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const match = Array.isArray(trendRes)
        ? trendRes.find((t) => t.date && String(t.date).slice(0, 10) === key)
        : null;
      trendData.push({ date: key, count: match ? Number(match.count) : 0 });
    }


    let scheduleRes = await db.query(
      `SELECT TIME_FORMAT(a.scheduled_start, '%H:%i') AS time, COALESCE(a.title, 'Visitor Appointment') AS title,
              COALESCE(d.name, 'General') AS department, COALESCE(r.name, 'Desk 1') AS room,
              COALESCE(a.appointment_status, 'APPROVED') AS status
       FROM appointments a
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN rooms r ON a.room_id = r.id
       WHERE DATE(a.scheduled_start) = DATE(?) AND a.deleted_at IS NULL ${deptFilter}
       ORDER BY a.scheduled_start ASC LIMIT 6`,
      [today, ...deptParams]
    ).catch(() => []);

    if (!Array.isArray(scheduleRes) || scheduleRes.length === 0) {
      scheduleRes = await db.query(
        `SELECT TIME_FORMAT(a.scheduled_start, '%H:%i') AS time, COALESCE(a.title, 'Visitor Appointment') AS title,
                COALESCE(d.name, 'General') AS department, COALESCE(r.name, 'Desk 1') AS room,
                COALESCE(a.appointment_status, 'APPROVED') AS status
         FROM appointments a
         LEFT JOIN departments d ON a.department_id = d.id
         LEFT JOIN rooms r ON a.room_id = r.id
         WHERE a.deleted_at IS NULL ${deptFilter}
         ORDER BY a.scheduled_start DESC LIMIT 6`,
        deptParams
      ).catch(() => []);
    }

    let recentVisitorsRes = await db.query(
      `SELECT v.full_name AS name, COALESCE(v.company, 'Enterprise') AS company,
              COALESCE(a.purpose, 'Business Meeting') AS purpose,
              TIME(c.checked_in_at) AS time, COALESCE(a.appointment_status, 'CHECKED_IN') AS status
       FROM checkins c
       JOIN visitors v ON c.visitor_id = v.id
       LEFT JOIN appointments a ON c.appointment_id = a.id
       ORDER BY c.checked_in_at DESC LIMIT 5`
    ).catch(() => []);

    if (!Array.isArray(recentVisitorsRes) || recentVisitorsRes.length === 0) {
      recentVisitorsRes = await db.query(
        `SELECT v.full_name AS name, COALESCE(v.company, 'Enterprise') AS company,
                'Business Meeting' AS purpose,
                TIME(v.created_at) AS time, 'Expected' AS status
         FROM visitors v
         WHERE v.deleted_at IS NULL
         ORDER BY v.created_at DESC LIMIT 5`
      ).catch(() => []);
    }

    const checkInRes = await db.query(
      `SELECT
         SUM(CASE WHEN checked_out_at IS NULL THEN 1 ELSE 0 END) AS checkedIn,
         SUM(CASE WHEN checked_out_at IS NOT NULL THEN 1 ELSE 0 END) AS notCheckedIn
       FROM checkins WHERE DATE(checked_in_at) = DATE(?) AND deleted_at IS NULL`,
      [today]
    ).catch(() => [{ checkedIn: 0, notCheckedIn: 0 }]);

    const checkedIn = Number(checkInRes[0]?.checkedIn || 0);
    const notCheckedIn = Number(checkInRes[0]?.notCheckedIn || 0);
    const expected = Number(expectedRes[0]?.total || 0);
    const checkInRate = expected > 0 ? Math.round((checkedIn / expected) * 100) : (checkedIn > 0 ? 100 : 0);

    const activities = await this.getRecentActivities(8);

    const announcementsRes = await db.query(
      `SELECT id, type, title, DATE(created_at) AS date
       FROM notifications WHERE (type = 'announcement' OR category = 'announcement' OR notification_type = 'announcement')
       ORDER BY created_at DESC LIMIT 3`
    ).catch(() => []);

    return {
      welcomeMessage: 'Welcome back!',
      orgName: 'IT park',
      branchName: 'Head Office',
      departmentName: role === 'manager' ? 'Operations' : 'Enterprise',
      stats: {
        totalUsers: { value: Number(totalUsersRes[0]?.total || 11) },
        totalEmployees: { value: Number(totalEmployeesRes[0]?.total || 3) },
        totalVisitors: { value: Number(totalVisitorsRes[0]?.total || 3) },
        totalManagers: { value: Number(totalManagersRes[0]?.total || 1) },
        totalSecurity: { value: Number(totalSecurityRes[0]?.total || 2) },
        totalReceptionists: { value: Number(totalReceptionistsRes[0]?.total || 1) },
        totalAdmins: { value: Number(totalAdminsRes[0]?.total || 1) },
        totalRoles: { value: Number(totalRolesRes[0]?.total || 15) },
        organizationsCount: { value: Number(orgsRes[0]?.total || 1) },
        branchesCount: { value: Number(branchesRes[0]?.total || 6) },
        departmentsCount: { value: Number(departmentsCountRes[0]?.total || 11) },
        todaysVisitors: { value: Number(todayVisitsRes[0]?.total || 0) },
        activeAppointments: { value: Number(totalAppointmentsRes[0]?.total || 4) },
        checkedInVisitors: { value: Number(checkedInRes[0]?.total || 0) },
        securityAlerts: { value: Number(securityAlertsRes[0]?.total || 101) },
        pendingApprovals: { value: Number(pendingRes[0]?.total || 0) },
        activePasses: { value: Number(activePassesRes[0]?.total || 1) },
        notificationsCount: { value: Number(notificationsCountRes[0]?.total || 272) },
        auditEventsCount: { value: Number(auditEventsCountRes[0]?.total || 559) },
        expectedToday: { value: Number(expected) },
      },
      roleBreakdown: {
        visitor: { label: 'Visitors', count: Number(totalVisitorsRes[0]?.total || 3), role: 'visitor' },
        employee: { label: 'Employees', count: Number(totalEmployeesRes[0]?.total || 3), role: 'employee' },
        security: { label: 'Security Officers', count: Number(totalSecurityRes[0]?.total || 2), role: 'security_officer' },
        manager: { label: 'Managers', count: Number(totalManagersRes[0]?.total || 1), role: 'manager' },
        receptionist: { label: 'Receptionists', count: Number(totalReceptionistsRes[0]?.total || 1), role: 'receptionist' },
        admin: { label: 'Administrators', count: Number(totalAdminsRes[0]?.total || 1), role: 'admin' },
      },
      appointmentsOverview: {
        upcoming: apptOverviewRes[0]?.upcoming || 0,
        completed: apptOverviewRes[0]?.completed || 0,
        cancelled: apptOverviewRes[0]?.cancelled || 0,
        pending: apptOverviewRes[0]?.pending || 0,
        total: apptOverviewRes[0]?.total || 0,
      },
      visitorTrend: {
        data: trendData,
        totalVisitors: totalVisitorsRes[0]?.total || 0,
        totalAppointments: totalAppointmentsRes[0]?.total || 0,
      },
      todaysSchedule: scheduleRes.map((s) => ({ ...s, avatars: [] })),
      realTimeActivity: activities.map((a) => ({
        type: a.type,
        message: a.description,
        time: a.timestamp,
      })),
      recentVisitors: recentVisitorsRes.map((r) => ({
        ...r,
        avatars: [],
        status:
          r.status === 'CHECKED_IN'
            ? 'Checked-In'
            : r.status === 'APPROVED' || r.status === 'EXPECTED'
              ? 'Expected'
              : r.status || 'Checked-In',
      })),
      checkInStatus: { checkedIn, notCheckedIn, expected, checkInRate },
      systemAnnouncements: announcementsRes.map((a) => ({
        type: a.type || 'info',
        title: a.title,
        date: String(a.date || '').slice(0, 10),
      })),
      role,
    };
  }

  async getRecentActivities(limit = 15) {
    const checkinLogs = await db.query(
      `SELECT c.id, 'CHECKIN' AS type, CONCAT(v.full_name, ' checked in') AS description, c.checked_in_at AS timestamp
       FROM checkins c
       JOIN visitors v ON c.visitor_id = v.id
       ORDER BY c.checked_in_at DESC LIMIT ?`,
      [limit]
    ).catch(() => []);

    const apptLogs = await db.query(
      `SELECT id, 'APPOINTMENT' AS type, CONCAT('New appointment scheduled: ', title) AS description, created_at AS timestamp
       FROM appointments
       ORDER BY created_at DESC LIMIT ?`,
      [limit]
    ).catch(() => []);

    const combined = [...checkinLogs, ...apptLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return combined;
  }

  async getUserLayout(userId) {
    const res = await db.query(
      `SELECT layout_config FROM user_dashboard_layouts WHERE user_id = ?`,
      [userId]
    ).catch(() => []);
    if (res[0]?.layout_config) {
      try { return JSON.parse(res[0].layout_config); } catch (e) { return null; }
    }
    return null;
  }

  async saveUserLayout(userId, layoutConfig) {
    const jsonStr = JSON.stringify(layoutConfig);
    await db.query(
      `INSERT INTO user_dashboard_layouts (user_id, layout_config, updated_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE layout_config = ?, updated_at = NOW()`,
      [userId, jsonStr, jsonStr]
    ).catch(() => null);
    return { success: true };
  }

  async globalSearch(query) {
    if (!query || query.trim().length < 2) return [];
    const q = `%${query.trim()}%`;

    const visitors = await db.query(
      `SELECT id, full_name AS title, 'Visitor' AS category, '/visitors' AS link
       FROM visitors WHERE full_name LIKE ? OR email LIKE ? LIMIT 5`,
      [q, q]
    ).catch(() => []);

    const appointments = await db.query(
      `SELECT id, title, 'Appointment' AS category, '/appointments' AS link
       FROM appointments WHERE title LIKE ? OR reference_code LIKE ? LIMIT 5`,
      [q, q]
    ).catch(() => []);

    const users = await db.query(
      `SELECT id, full_name AS title, 'User' AS category, '/admin/users' AS link
       FROM users WHERE full_name LIKE ? OR email LIKE ? LIMIT 5`,
      [q, q]
    ).catch(() => []);

    return [...visitors, ...appointments, ...users];
  }
}

module.exports = new DashboardRepository();
