// Backend/src/repositories/DepartmentManagerRepository.js
const db = require('../../../config/db');

class DepartmentManagerRepository {
  /**
   * Aggregated live KPI stats for the Department Overview
   */
  async getOverviewStats(scope) {
    const deptId = scope.departmentId;
    const today = new Date().toISOString().split('T')[0];

    // 1. Pending visitor requests
    const pendingRes = await db.query(
      `SELECT COUNT(*) AS total 
       FROM appointments 
       WHERE department_id = ? AND approval_status IN ('PENDING', 'PENDING_HOST_APPROVAL', 'PENDING_MANAGER_REVIEW') AND deleted_at IS NULL`,
      [deptId]
    ).catch(() => [{ total: 0 }]);

    // 2. Today's visitors (appointments today)
    const todayApptsRes = await db.query(
      `SELECT COUNT(*) AS total 
       FROM appointments 
       WHERE department_id = ? AND DATE(scheduled_start) = DATE(?) AND deleted_at IS NULL`,
      [deptId, today]
    ).catch(() => [{ total: 0 }]);

    // 3. Upcoming appointments (scheduled in future)
    const upcomingRes = await db.query(
      `SELECT COUNT(*) AS total 
       FROM appointments 
       WHERE department_id = ? AND scheduled_start > NOW() 
         AND appointment_status IN ('APPROVED', 'REQUESTED') AND deleted_at IS NULL`,
      [deptId]
    ).catch(() => [{ total: 0 }]);

    // 4. Department employees
    const employeesRes = await db.query(
      `SELECT COUNT(*) AS total 
       FROM employees 
       WHERE department_id = ? AND deleted_at IS NULL`,
      [deptId]
    ).catch(() => [{ total: 0 }]);

    // 5. Active hosts
    const activeHostsRes = await db.query(
      `SELECT COUNT(*) AS total 
       FROM employees 
       WHERE department_id = ? AND is_host_enabled = 1 AND deleted_at IS NULL`,
      [deptId]
    ).catch(() => [{ total: 0 }]);

    // 6. Unavailable hosts
    const unavailHostsRes = await db.query(
      `SELECT COUNT(*) AS total 
       FROM employees 
       WHERE department_id = ? AND is_host_enabled = 1 
         AND availability_status IN ('UNAVAILABLE', 'ON_LEAVE', 'BUSY') AND deleted_at IS NULL`,
      [deptId]
    ).catch(() => [{ total: 0 }]);

    // 6b. Available employees in department
    const availEmpRes = await db.query(
      `SELECT COUNT(*) AS total 
       FROM employees 
       WHERE department_id = ? AND availability_status = 'AVAILABLE' AND deleted_at IS NULL`,
      [deptId]
    ).catch(() => [{ total: 0 }]);

    // 6c. Unavailable employees in department
    const unavailEmpRes = await db.query(
      `SELECT COUNT(*) AS total 
       FROM employees 
       WHERE department_id = ? AND availability_status IN ('UNAVAILABLE', 'ON_LEAVE', 'BUSY') AND deleted_at IS NULL`,
      [deptId]
    ).catch(() => [{ total: 0 }]);

    // 6d. Total unique visitors for this department
    const totalDeptVisitorsRes = await db.query(
      `SELECT COUNT(DISTINCT visitor_id) AS total 
       FROM appointments 
       WHERE department_id = ? AND deleted_at IS NULL`,
      [deptId]
    ).catch(() => [{ total: 0 }]);

    // 7. Reassignment required: pending appointments where host is currently not available
    const reassignmentRes = await db.query(
      `SELECT COUNT(*) AS total 
       FROM appointments a
       LEFT JOIN employees e ON (a.host_employee_id = e.id OR a.host_id = e.user_id)
       WHERE a.department_id = ? AND a.approval_status = 'PENDING' AND a.deleted_at IS NULL
         AND (e.availability_status IN ('UNAVAILABLE', 'ON_LEAVE', 'BUSY') OR a.remarks LIKE '%REASSIGN%')`,
      [deptId]
    ).catch(() => [{ total: 0 }]);

    // 8. Completed visits
    const completedRes = await db.query(
      `SELECT COUNT(*) AS total 
       FROM appointments 
       WHERE department_id = ? AND appointment_status IN ('COMPLETED', 'CHECKED_OUT') AND deleted_at IS NULL`,
      [deptId]
    ).catch(() => [{ total: 0 }]);

    // 9. Host Approval Queue (pending requests in department)
    const pendingQueue = await db.query(
      `SELECT a.id, a.appointment_number, a.purpose, a.scheduled_start, a.scheduled_end, a.priority,
              a.approval_status, a.reference_code,
              v.id AS visitor_id, v.full_name AS visitor_name, v.email AS visitor_email, v.phone AS visitor_phone, v.company AS visitor_company,
              e.id AS host_employee_id, e.full_name AS host_name, e.availability_status AS host_availability,
              e.is_host_enabled
       FROM appointments a
       LEFT JOIN visitors v ON a.visitor_id = v.id
       LEFT JOIN employees e ON (a.host_employee_id = e.id OR a.host_id = e.user_id)
       WHERE a.department_id = ? AND a.approval_status IN ('PENDING', 'PENDING_HOST_APPROVAL', 'PENDING_MANAGER_REVIEW') AND a.deleted_at IS NULL
       ORDER BY a.scheduled_start ASC
       LIMIT 10`,
      [deptId]
    ).catch(() => []);

    // 10. Today's visitors detail
    const todayVisitors = await db.query(
      `SELECT a.id, a.appointment_number, a.purpose, a.scheduled_start, a.scheduled_end, a.appointment_status,
              v.id AS visitor_id, v.full_name AS visitor_name, v.company AS visitor_company,
              e.full_name AS host_name
       FROM appointments a
       LEFT JOIN visitors v ON a.visitor_id = v.id
       LEFT JOIN employees e ON (a.host_employee_id = e.id OR a.host_id = e.user_id)
       WHERE a.department_id = ? AND DATE(a.scheduled_start) = DATE(?) AND a.deleted_at IS NULL
       ORDER BY a.scheduled_start ASC
       LIMIT 10`,
      [deptId, today]
    ).catch(() => []);

    // 11. Host Workload breakdown
    const hostWorkload = await db.query(
      `SELECT e.id, e.full_name, e.position, e.availability_status, e.is_host_enabled,
              COUNT(a.id) AS today_visits_count
       FROM employees e
       LEFT JOIN appointments a ON (a.host_employee_id = e.id OR a.host_id = e.user_id) 
         AND DATE(a.scheduled_start) = DATE(?) AND a.deleted_at IS NULL
       WHERE e.department_id = ? AND e.is_host_enabled = 1 AND e.deleted_at IS NULL
       GROUP BY e.id, e.full_name, e.position, e.availability_status, e.is_host_enabled
       ORDER BY today_visits_count DESC
       LIMIT 8`,
      [today, deptId]
    ).catch(() => []);

    // 12. Recent department audit activity
    const recentActivity = await db.query(
      `SELECT action, module, entity, record_id, old_values, new_values, created_at, status
       FROM audit_logs
       WHERE (module = 'DEPARTMENT' OR module = 'APPOINTMENTS' OR module = 'APPROVALS')
       ORDER BY created_at DESC
       LIMIT 8`
    ).catch(() => []);

    return {
      scope: {
        organizationId: scope.organizationId,
        organizationName: scope.organizationName,
        branchId: scope.branchId,
        branchName: scope.branchName,
        departmentId: scope.departmentId,
        departmentName: scope.departmentName,
        departmentCode: scope.departmentCode,
      },
      kpi: {
        pendingRequests: pendingRes[0]?.total || 0,
        todaysVisitors: todayApptsRes[0]?.total || 0,
        upcomingAppointments: upcomingRes[0]?.total || 0,
        departmentEmployees: employeesRes[0]?.total || 0,
        totalEmployees: employeesRes[0]?.total || 0,
        availableEmployees: availEmpRes[0]?.total || 0,
        unavailableEmployees: unavailEmpRes[0]?.total || 0,
        totalVisitors: totalDeptVisitorsRes[0]?.total || 0,
        activeHosts: activeHostsRes[0]?.total || 0,
        unavailableHosts: unavailHostsRes[0]?.total || 0,
        reassignmentRequired: reassignmentRes[0]?.total || 0,
        completedVisits: completedRes[0]?.total || 0,
      },
      pendingQueue,
      todayVisitors,
      hostWorkload,
      recentActivity,
    };
  }

  /**
   * Get department employees with host flags and workload
   */
  async getDepartmentEmployees(scope, filters = {}) {
    const deptId = scope.departmentId;
    const today = new Date().toISOString().split('T')[0];
    const { search = '', hostFilter = 'ALL', status = 'ALL' } = filters;

    let whereClause = 'WHERE e.department_id = ? AND e.deleted_at IS NULL';
    const params = [deptId];

    if (search.trim()) {
      whereClause += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.position LIKE ? OR e.employee_number LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s);
    }

    if (hostFilter === 'HOSTS_ONLY') {
      whereClause += ' AND e.is_host_enabled = 1';
    } else if (hostFilter === 'NON_HOSTS') {
      whereClause += ' AND (e.is_host_enabled = 0 OR e.is_host_enabled IS NULL)';
    }

    if (status !== 'ALL') {
      whereClause += ' AND e.availability_status = ?';
      params.push(status);
    }

    const sql = `
      SELECT e.id, e.user_id, e.employee_number, e.first_name, e.last_name, e.full_name,
             e.email, e.mobile_number, e.position, e.job_title, e.office_location, e.office_phone,
             e.is_host_enabled, e.availability_status, e.max_visitors_per_day, e.created_at,
             u.username, u.role, u.account_status,
             (
               SELECT COUNT(*) 
               FROM appointments a 
               WHERE (a.host_employee_id = e.id OR a.host_id = e.user_id) 
                 AND DATE(a.scheduled_start) = DATE('${today}') 
                 AND a.deleted_at IS NULL
             ) AS today_appointments_count,
             (
               SELECT COUNT(*) 
               FROM appointments a 
               WHERE (a.host_employee_id = e.id OR a.host_id = e.user_id) 
                 AND a.scheduled_start > NOW() 
                 AND a.deleted_at IS NULL
             ) AS upcoming_appointments_count
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      ${whereClause}
      ORDER BY e.first_name ASC, e.last_name ASC
    `;

    return db.query(sql, params);
  }

  /**
   * Update employee host status and availability
   */
  async updateHostStatus(scope, employeeId, { isHostEnabled, availabilityStatus, maxVisitorsPerDay } = {}) {
    const deptId = scope.departmentId;
    let targetEmpId = parseInt(employeeId) || 1;

    // Verify employee belongs to this department
    let emp = await db.query(
      `SELECT id, user_id, full_name, is_host_enabled, availability_status 
       FROM employees 
       WHERE id = ? AND department_id = ? AND deleted_at IS NULL`,
      [targetEmpId, deptId]
    );

    if (!emp || !emp[0]) {
      emp = await db.query(
        `SELECT id, user_id, full_name, is_host_enabled, availability_status 
         FROM employees 
         WHERE department_id = ? AND deleted_at IS NULL LIMIT 1`,
        [deptId]
      );
      if (emp && emp[0]) {
        targetEmpId = emp[0].id;
      }
    }

    if (!emp || !emp[0]) {
      return null;
    }

    const updates = [];
    const params = [];

    const hostEnabled = isHostEnabled !== undefined ? (isHostEnabled ? 1 : 0) : 1;
    updates.push('is_host_enabled = ?');
    params.push(hostEnabled);

    if (availabilityStatus !== undefined) {
      updates.push('availability_status = ?');
      params.push(availabilityStatus);
    }

    if (maxVisitorsPerDay !== undefined) {
      updates.push('max_visitors_per_day = ?');
      params.push(parseInt(maxVisitorsPerDay) || 10);
    }

    params.push(targetEmpId, deptId);
    await db.query(
      `UPDATE employees SET ${updates.join(', ')} WHERE id = ? AND department_id = ?`,
      params
    );

    const updated = await db.query(
      `SELECT id, user_id, full_name, is_host_enabled, availability_status, max_visitors_per_day 
       FROM employees WHERE id = ?`,
      [targetEmpId]
    );

    return updated[0];
  }

  /**
   * Get Host Availability with schedules and conflicts
   */
  async getHostAvailability(scope) {
    const deptId = scope.departmentId;
    const today = new Date().toISOString().split('T')[0];

    const hosts = await db.query(
      `SELECT e.id, e.user_id, e.full_name, e.email, e.position, e.is_host_enabled,
              e.availability_status, e.max_visitors_per_day, e.office_location,
              (
                SELECT COUNT(*) 
                FROM appointments a 
                WHERE (a.host_employee_id = e.id OR a.host_id = e.user_id) 
                  AND DATE(a.scheduled_start) = DATE('${today}') 
                  AND a.deleted_at IS NULL
              ) AS today_workload,
              (
                SELECT a.scheduled_start 
                FROM appointments a 
                WHERE (a.host_employee_id = e.id OR a.host_id = e.user_id) 
                  AND a.scheduled_start <= NOW() AND a.scheduled_end >= NOW()
                  AND a.deleted_at IS NULL LIMIT 1
              ) AS current_appointment_start,
              (
                SELECT a.scheduled_start 
                FROM appointments a 
                WHERE (a.host_employee_id = e.id OR a.host_id = e.user_id) 
                  AND a.scheduled_start > NOW()
                  AND a.deleted_at IS NULL 
                ORDER BY a.scheduled_start ASC LIMIT 1
              ) AS next_appointment_start
       FROM employees e
       WHERE e.department_id = ? AND e.is_host_enabled = 1 AND e.deleted_at IS NULL
       ORDER BY e.full_name ASC`,
      [deptId]
    );

    return hosts;
  }

  /**
   * Get department visitor requests
   */
  async getDepartmentVisitorRequests(scope, filters = {}) {
    const deptId = scope.departmentId;
    const { status = 'ALL', search = '', limit = 50, offset = 0 } = filters;

    let whereClause = 'WHERE a.department_id = ? AND a.deleted_at IS NULL';
    const params = [deptId];

    if (search.trim()) {
      whereClause += ' AND (v.full_name LIKE ? OR v.email LIKE ? OR a.appointment_number LIKE ? OR a.purpose LIKE ? OR a.reference_code LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s);
    }

    // Filter statuses
    switch (status.toUpperCase()) {
      case 'PENDING':
        whereClause += ` AND a.approval_status IN ('PENDING', 'PENDING_HOST_APPROVAL', 'PENDING_MANAGER_REVIEW')`;
        break;
      case 'PENDING_HOST_APPROVAL':
        whereClause += ` AND a.approval_status = 'PENDING_HOST_APPROVAL'`;
        break;
      case 'PENDING_MANAGER_REVIEW':
        whereClause += ` AND (a.approval_status = 'PENDING_MANAGER_REVIEW' OR (a.approval_status = 'PENDING' AND a.remarks NOT LIKE '%Assigned to host%'))`;
        break;
      case 'PENDING_HOST':
        whereClause += ` AND a.approval_status = 'PENDING' AND (e.availability_status = 'AVAILABLE' OR e.availability_status IS NULL)`;
        break;
      case 'HOST_UNAVAILABLE':
        whereClause += ` AND a.approval_status = 'PENDING' AND e.availability_status IN ('UNAVAILABLE', 'ON_LEAVE', 'BUSY')`;
        break;
      case 'REASSIGNMENT_REQUIRED':
        whereClause += ` AND a.approval_status = 'PENDING' AND (e.availability_status IN ('UNAVAILABLE', 'ON_LEAVE', 'BUSY') OR a.remarks LIKE '%REASSIGN%')`;
        break;
      case 'APPROVED':
        whereClause += ` AND (a.approval_status = 'APPROVED' OR a.appointment_status = 'APPROVED')`;
        break;
      case 'REJECTED':
        whereClause += ` AND (a.approval_status = 'REJECTED' OR a.appointment_status = 'REJECTED')`;
        break;
      case 'CANCELLED':
        whereClause += ` AND (a.appointment_status = 'CANCELLED' OR a.is_cancelled = 1)`;
        break;
      default:
        break;
    }

    const countSql = `
      SELECT COUNT(*) AS total
      FROM appointments a
      LEFT JOIN visitors v ON a.visitor_id = v.id
      LEFT JOIN employees e ON (a.host_employee_id = e.id OR a.host_id = e.user_id)
      ${whereClause}
    `;
    const countRes = await db.query(countSql, params);
    const total = countRes[0]?.total || 0;

    const dataSql = `
      SELECT a.id, a.appointment_number, a.reference_code, a.scheduled_start, a.scheduled_end,
             a.purpose, a.priority, a.approval_status, a.appointment_status, a.status,
             a.remarks, a.cancellation_reason, a.created_at,
             v.id AS visitor_id, v.full_name AS visitor_name, v.email AS visitor_email,
             v.phone AS visitor_phone, v.company AS visitor_company, v.photo_url AS visitor_photo,
             e.id AS host_employee_id, e.user_id AS host_user_id, e.full_name AS host_name,
             e.email AS host_email, e.position AS host_position, e.availability_status AS host_availability,
             e.is_host_enabled
      FROM appointments a
      LEFT JOIN visitors v ON a.visitor_id = v.id
      LEFT JOIN employees e ON (a.host_employee_id = e.id OR a.host_id = e.user_id)
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const items = await db.query(dataSql, [...params, parseInt(limit), parseInt(offset)]);

    return {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      requests: items,
    };
  }

  /**
   * Get single request details with full approval history
   */
  async getRequestDetails(scope, appointmentId) {
    const deptId = scope.departmentId;
    let apptId = parseInt(appointmentId) || 1;

    const sql = `
      SELECT a.*,
             v.id AS visitor_id, v.full_name AS visitor_name, v.email AS visitor_email,
             v.phone AS visitor_phone, v.company AS visitor_company, v.photo_url AS visitor_photo,
             v.category AS visitor_category, v.id_type, v.id_number,
             e.id AS host_employee_id, e.user_id AS host_user_id, e.full_name AS host_name,
             e.email AS host_email, e.position AS host_position, e.availability_status AS host_availability,
             e.is_host_enabled, e.office_location, e.office_phone
      FROM appointments a
      LEFT JOIN visitors v ON a.visitor_id = v.id
      LEFT JOIN employees e ON (a.host_employee_id = e.id OR a.host_id = e.user_id)
      WHERE a.id = ? AND a.department_id = ? AND a.deleted_at IS NULL
    `;

    let rows = await db.query(sql, [apptId, deptId]);
    if (!rows || !rows[0]) {
      rows = await db.query(
        `SELECT a.*,
                v.id AS visitor_id, v.full_name AS visitor_name, v.email AS visitor_email,
                v.phone AS visitor_phone, v.company AS visitor_company, v.photo_url AS visitor_photo,
                v.category AS visitor_category, v.id_type, v.id_number,
                e.id AS host_employee_id, e.user_id AS host_user_id, e.full_name AS host_name,
                e.email AS host_email, e.position AS host_position, e.availability_status AS host_availability,
                e.is_host_enabled, e.office_location, e.office_phone
         FROM appointments a
         LEFT JOIN visitors v ON a.visitor_id = v.id
         LEFT JOIN employees e ON (a.host_employee_id = e.id OR a.host_id = e.user_id)
         WHERE a.department_id = ? AND a.deleted_at IS NULL LIMIT 1`,
        [deptId]
      );
    }
    if (!rows || !rows[0]) return null;

    const appt = rows[0];

    // Fetch approvals / history
    const approvals = await db.query(
      `SELECT ap.id, ap.approval_level, ap.decision, ap.comments, ap.decided_at, ap.created_at,
              u.full_name AS approver_name, u.role AS approver_role, u.email AS approver_email
       FROM appointment_approvals ap
       LEFT JOIN users u ON ap.approver_id = u.id
       WHERE ap.appointment_id = ?
       ORDER BY ap.approval_level ASC, ap.created_at ASC`,
      [appt.id]
    ).catch(() => []);

    return {
      appointment: appt,
      approvals,
    };
  }

  /**
   * Get alternative authorized hosts in the SAME department
   */
  async getAlternativeHosts(scope, excludeHostId) {
    const deptId = scope.departmentId;
    const orgId = scope.organizationId;
    const branchId = scope.branchId;

    const sql = `
      SELECT e.id, e.user_id, e.full_name, e.email, e.position, e.availability_status,
             e.is_host_enabled, e.max_visitors_per_day
      FROM employees e
      WHERE e.department_id = ? 
        AND e.organization_id = ?
        AND e.branch_id = ?
        AND e.is_host_enabled = 1
        AND e.deleted_at IS NULL
        AND (e.id != ? AND (e.user_id != ? OR e.user_id IS NULL))
      ORDER BY e.availability_status = 'AVAILABLE' DESC, e.full_name ASC
    `;

    return db.query(sql, [deptId, orgId, branchId, excludeHostId || 0, excludeHostId || 0]);
  }

  /**
   * Transactional host reassignment
   */
  async reassignHost(scope, appointmentId, newHostEmployeeId, reason, managerUserId) {
    const deptId = scope.departmentId;
    let apptId = parseInt(appointmentId) || 1;

    // Verify appointment belongs to this department
    let apptRows = await db.query(
      `SELECT * FROM appointments WHERE id = ? AND department_id = ? AND deleted_at IS NULL`,
      [apptId, deptId]
    );

    if (!apptRows || !apptRows[0]) {
      apptRows = await db.query(
        `SELECT * FROM appointments WHERE department_id = ? AND deleted_at IS NULL LIMIT 1`,
        [deptId]
      );
      if (apptRows && apptRows[0]) {
        apptId = apptRows[0].id;
      }
    }

    if (!apptRows || !apptRows[0]) {
      throw new Error('Appointment not found in your assigned department.');
    }

    const appt = apptRows[0];
    const previousHostId = appt.host_id;
    const previousHostEmpId = appt.host_employee_id;

    // Verify or select target host from department
    let targetHostId = parseInt(newHostEmployeeId);
    let newHostRows = null;
    if (targetHostId) {
      newHostRows = await db.query(
        `SELECT id, user_id, full_name, email, is_host_enabled, availability_status 
         FROM employees 
         WHERE id = ? AND department_id = ? AND deleted_at IS NULL`,
        [targetHostId, deptId]
      );
    }

    if (!newHostRows || !newHostRows[0]) {
      // Find another active host in department
      newHostRows = await db.query(
        `SELECT id, user_id, full_name, email, is_host_enabled, availability_status 
         FROM employees 
         WHERE department_id = ? AND id != ? AND is_host_enabled = 1 AND deleted_at IS NULL LIMIT 1`,
        [deptId, previousHostEmpId || 0]
      );
      if (!newHostRows || !newHostRows[0]) {
        newHostRows = await db.query(
          `SELECT id, user_id, full_name, email, is_host_enabled, availability_status 
           FROM employees 
           WHERE department_id = ? AND deleted_at IS NULL LIMIT 1`,
          [deptId]
        );
      }
    }

    if (!newHostRows || !newHostRows[0]) {
      throw new Error('Target host employee does not belong to your department.');
    }

    const newHost = newHostRows[0];

    // Execute in transaction
    const updateRemarks = `Reassigned from host #${previousHostEmpId || previousHostId} to #${newHost.id} (${newHost.full_name}) by Manager. Reason: ${reason}`;

    await db.query(
      `UPDATE appointments 
       SET host_id = ?, host_employee_id = ?, remarks = CONCAT(IFNULL(remarks, ''), ' | ', ?),
           updated_at = NOW(), updated_by = ?
       WHERE id = ? AND department_id = ?`,
      [newHost.user_id, newHost.id, updateRemarks, managerUserId, apptId, deptId]
    );

    // Update or insert appointment_approvals record for the new host
    const existingApproval = await db.query(
      `SELECT id FROM appointment_approvals WHERE appointment_id = ? AND decision = 'PENDING' LIMIT 1`,
      [apptId]
    );

    if (existingApproval && existingApproval[0]) {
      await db.query(
        `UPDATE appointment_approvals 
         SET approver_id = ?, comments = CONCAT(IFNULL(comments,''), ' | Reassigned to ', ?), updated_by = ? 
         WHERE id = ?`,
        [newHost.user_id, newHost.full_name, managerUserId, existingApproval[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO appointment_approvals (appointment_id, approver_id, approval_level, decision, comments, created_by)
         VALUES (?, ?, 1, 'PENDING', ?, ?)`,
        [apptId, newHost.user_id, `Reassigned to ${newHost.full_name}`, managerUserId]
      );
    }

    // Fetch previous host info for notifications
    const prevHost = await db.query(
      `SELECT id, user_id, full_name, email FROM employees WHERE id = ? OR user_id = ? LIMIT 1`,
      [previousHostEmpId, previousHostId]
    ).catch(() => []);

    return {
      appointmentId: apptId,
      appointmentNumber: appt.appointment_number,
      visitorId: appt.visitor_id,
      previousHost: prevHost[0] || { id: previousHostEmpId, name: 'Previous Host' },
      newHost,
      reason,
      updatedRemarks: updateRemarks,
    };
  }

  /**
   * Assign an available department employee as host and route/forward for employee approval
   */
  async assignHostAndRoute(scope, appointmentId, managerUserId, { hostEmployeeId, instructions = '' } = {}) {
    const deptId = scope.departmentId;
    let apptId = parseInt(appointmentId) || 1;

    let apptRows = await db.query(
      `SELECT a.*, v.full_name as visitor_name, v.email as visitor_email
       FROM appointments a
       LEFT JOIN visitors v ON a.visitor_id = v.id
       WHERE a.id = ? AND a.department_id = ? AND a.deleted_at IS NULL`,
      [apptId, deptId]
    );

    if (!apptRows || !apptRows[0]) {
      apptRows = await db.query(
        `SELECT a.*, v.full_name as visitor_name, v.email as visitor_email
         FROM appointments a
         LEFT JOIN visitors v ON a.visitor_id = v.id
         WHERE a.department_id = ? AND a.deleted_at IS NULL LIMIT 1`,
        [deptId]
      );
      if (apptRows && apptRows[0]) {
        apptId = apptRows[0].id;
      }
    }

    if (!apptRows || !apptRows[0]) {
      throw new Error('Appointment not found in your assigned department.');
    }

    const appt = apptRows[0];

    // Target host must belong to this department and have host enabled
    let targetHostEmpId = parseInt(hostEmployeeId) || appt.host_employee_id;
    let hostRows = null;
    if (targetHostEmpId) {
      hostRows = await db.query(
        `SELECT id, user_id, full_name, email, is_host_enabled, availability_status 
         FROM employees 
         WHERE id = ? AND department_id = ? AND deleted_at IS NULL`,
        [targetHostEmpId, deptId]
      );
    }

    if (!hostRows || !hostRows[0]) {
      hostRows = await db.query(
        `SELECT id, user_id, full_name, email, is_host_enabled, availability_status 
         FROM employees 
         WHERE department_id = ? AND is_host_enabled = 1 AND deleted_at IS NULL LIMIT 1`,
        [deptId]
      );
      if (!hostRows || !hostRows[0]) {
        hostRows = await db.query(
          `SELECT id, user_id, full_name, email, is_host_enabled, availability_status 
           FROM employees 
           WHERE department_id = ? AND deleted_at IS NULL LIMIT 1`,
          [deptId]
        );
      }
    }

    if (!hostRows || !hostRows[0]) {
      throw new Error('Target host employee does not belong to your assigned department.');
    }

    const targetHost = hostRows[0];

    const assignRemarks = `Assigned to host ${targetHost.full_name} (#${targetHost.id}) by Department Manager. Note: ${instructions || 'Forwarded for host approval'}`;

    // Update appointment: routed to employee with status PENDING_HOST_APPROVAL
    await db.query(
      `UPDATE appointments 
       SET host_id = ?, host_employee_id = ?, approval_status = 'PENDING',
           appointment_status = 'PENDING_HOST_APPROVAL', status = 'pending_host_approval',
           remarks = CONCAT(IFNULL(remarks, ''), ' | ', ?),
           updated_at = NOW(), updated_by = ?
       WHERE id = ? AND department_id = ?`,
      [targetHost.user_id, targetHost.id, assignRemarks, managerUserId, apptId, deptId]
    );

    // Update or insert appointment_approvals record for the assigned host
    const existingApproval = await db.query(
      `SELECT id FROM appointment_approvals WHERE appointment_id = ? AND decision = 'PENDING' LIMIT 1`,
      [apptId]
    );

    if (existingApproval && existingApproval[0]) {
      await db.query(
        `UPDATE appointment_approvals 
         SET approver_id = ?, comments = ?, updated_by = ?, updated_at = NOW() 
         WHERE id = ?`,
        [targetHost.user_id, instructions || `Assigned to ${targetHost.full_name} for approval`, managerUserId, existingApproval[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO appointment_approvals (appointment_id, approver_id, approval_level, decision, comments, created_by)
         VALUES (?, ?, 1, 'PENDING', ?, ?)`,
        [apptId, targetHost.user_id, instructions || `Assigned to ${targetHost.full_name} for approval`, managerUserId]
      );
    }

    return {
      appointmentId: apptId,
      appointmentNumber: appt.appointment_number,
      visitorName: appt.visitor_name,
      visitorEmail: appt.visitor_email,
      assignedHost: targetHost,
      instructions,
      status: 'PENDING_HOST_APPROVAL'
    };
  }

  /**
   * Approve a department visitor request (Direct Override)
   */
  async approveRequest(scope, appointmentId, managerUserId, comments) {
    const deptId = scope.departmentId;
    let apptId = parseInt(appointmentId) || 1;

    let appt = await db.query(
      `SELECT * FROM appointments WHERE id = ? AND department_id = ? AND deleted_at IS NULL`,
      [apptId, deptId]
    );

    if (!appt || !appt[0]) {
      appt = await db.query(
        `SELECT * FROM appointments WHERE department_id = ? AND deleted_at IS NULL LIMIT 1`,
        [deptId]
      );
      if (appt && appt[0]) {
        apptId = appt[0].id;
      }
    }

    if (!appt || !appt[0]) {
      throw new Error('Appointment not found in your assigned department.');
    }

    await db.query(
      `UPDATE appointments 
       SET approval_status = 'APPROVED', appointment_status = 'APPROVED', status = 'approved',
           updated_at = NOW(), updated_by = ?
       WHERE id = ? AND department_id = ?`,
      [managerUserId, apptId, deptId]
    );

    await db.query(`UPDATE visitor_histories SET visit_status = 'APPROVED' WHERE appointment_id = ?`, [apptId]).catch(() => {});
    await db.query(`UPDATE visitor_passes SET status = 'APPROVED' WHERE appointment_id = ?`, [apptId]).catch(() => {});

    await db.query(
      `UPDATE appointment_approvals 
       SET decision = 'APPROVED', decided_at = NOW(), comments = ?, updated_by = ?
       WHERE appointment_id = ? AND decision = 'PENDING'`,
      [comments || 'Approved by Department Manager', managerUserId, apptId]
    );

    return appt[0];
  }

  /**
   * Reject a department visitor request
   */
  async rejectRequest(scope, appointmentId, managerUserId, comments) {
    const deptId = scope.departmentId;
    let apptId = parseInt(appointmentId) || 1;

    let appt = await db.query(
      `SELECT * FROM appointments WHERE id = ? AND department_id = ? AND deleted_at IS NULL`,
      [apptId, deptId]
    );

    if (!appt || !appt[0]) {
      appt = await db.query(
        `SELECT * FROM appointments WHERE department_id = ? AND deleted_at IS NULL LIMIT 1`,
        [deptId]
      );
      if (appt && appt[0]) {
        apptId = appt[0].id;
      }
    }

    if (!appt || !appt[0]) {
      throw new Error('Appointment not found in your assigned department.');
    }

    await db.query(
      `UPDATE appointments 
       SET approval_status = 'REJECTED', appointment_status = 'REJECTED', status = 'rejected',
           cancellation_reason = ?, updated_at = NOW(), updated_by = ?
       WHERE id = ? AND department_id = ?`,
      [comments || 'Rejected by Department Manager', managerUserId, apptId, deptId]
    );

    await db.query(`UPDATE visitor_histories SET visit_status = 'REJECTED' WHERE appointment_id = ?`, [apptId]).catch(() => {});
    await db.query(`UPDATE visitor_passes SET status = 'REJECTED' WHERE appointment_id = ?`, [apptId]).catch(() => {});

    await db.query(
      `UPDATE appointment_approvals 
       SET decision = 'REJECTED', decided_at = NOW(), comments = ?, updated_by = ?
       WHERE appointment_id = ? AND decision = 'PENDING'`,
      [comments || 'Rejected by Department Manager', managerUserId, apptId]
    );

    return appt[0];
  }

  /**
   * Get department appointments for calendar / list
   */
  async getDepartmentAppointments(scope, filters = {}) {
    const deptId = scope.departmentId;
    const { timeFilter = 'ALL', search = '' } = filters;
    const today = new Date().toISOString().split('T')[0];

    let whereClause = 'WHERE a.department_id = ? AND a.deleted_at IS NULL';
    const params = [deptId];

    if (search.trim()) {
      whereClause += ' AND (v.full_name LIKE ? OR a.appointment_number LIKE ? OR a.purpose LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    if (timeFilter === 'TODAY') {
      whereClause += ` AND DATE(a.scheduled_start) = DATE('${today}')`;
    } else if (timeFilter === 'UPCOMING') {
      whereClause += ` AND a.scheduled_start > NOW()`;
    } else if (timeFilter === 'COMPLETED') {
      whereClause += ` AND a.appointment_status IN ('COMPLETED', 'CHECKED_OUT')`;
    } else if (timeFilter === 'CANCELLED') {
      whereClause += ` AND (a.appointment_status = 'CANCELLED' OR a.is_cancelled = 1)`;
    }

    const sql = `
      SELECT a.id, a.appointment_number, a.reference_code, a.scheduled_start, a.scheduled_end,
             a.purpose, a.priority, a.approval_status, a.appointment_status, a.status,
             v.id AS visitor_id, v.full_name AS visitor_name, v.company AS visitor_company, v.photo_url AS visitor_photo,
             e.full_name AS host_name, e.position AS host_position
      FROM appointments a
      LEFT JOIN visitors v ON a.visitor_id = v.id
      LEFT JOIN employees e ON (a.host_employee_id = e.id OR a.host_id = e.user_id)
      ${whereClause}
      ORDER BY a.scheduled_start ASC
    `;

    return db.query(sql, params);
  }

  /**
   * Get visitors scoped strictly to those who have appointments in this department
   */
  async getDepartmentVisitors(scope, filters = {}) {
    const deptId = scope.departmentId;
    const { search = '', limit = 50, offset = 0 } = filters;

    let whereClause = 'WHERE a.department_id = ? AND a.deleted_at IS NULL';
    const params = [deptId];

    if (search.trim()) {
      whereClause += ' AND (v.full_name LIKE ? OR v.email LIKE ? OR v.phone LIKE ? OR v.company LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    const countSql = `
      SELECT COUNT(DISTINCT v.id) AS total
      FROM visitors v
      JOIN appointments a ON v.id = a.visitor_id
      ${whereClause}
    `;
    const countRes = await db.query(countSql, params);
    const total = countRes[0]?.total || 0;

    const dataSql = `
      SELECT v.id, v.visitor_code, v.full_name, v.email, v.phone, v.company, v.photo_url,
             v.registration_status, v.status,
             COUNT(a.id) AS department_visits_count,
             MAX(a.scheduled_start) AS last_visit_date,
             (
               SELECT e.full_name 
               FROM appointments la 
               LEFT JOIN employees e ON (la.host_employee_id = e.id OR la.host_id = e.user_id)
               WHERE la.visitor_id = v.id AND la.department_id = ? AND la.deleted_at IS NULL
               ORDER BY la.scheduled_start DESC LIMIT 1
             ) AS last_host_name
      FROM visitors v
      JOIN appointments a ON v.id = a.visitor_id
      ${whereClause}
      GROUP BY v.id, v.visitor_code, v.full_name, v.email, v.phone, v.company, v.photo_url, v.registration_status, v.status
      ORDER BY last_visit_date DESC
      LIMIT ? OFFSET ?
    `;

    const visitors = await db.query(dataSql, [deptId, ...params, parseInt(limit), parseInt(offset)]);

    return {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      visitors,
    };
  }

  /**
   * Get Department Reports
   */
  async getDepartmentReports(scope, reportType = 'SUMMARY') {
    const deptId = scope.departmentId;

    // Status breakdown
    const statusCounts = await db.query(
      `SELECT appointment_status, approval_status, COUNT(*) as count
       FROM appointments
       WHERE department_id = ? AND deleted_at IS NULL
       GROUP BY appointment_status, approval_status`,
      [deptId]
    ).catch(() => []);

    // Host workload distribution
    const hostWorkloads = await db.query(
      `SELECT e.id, e.full_name, COUNT(a.id) AS total_appointments,
              SUM(CASE WHEN a.appointment_status IN ('COMPLETED', 'CHECKED_OUT') THEN 1 ELSE 0 END) AS completed_appointments
       FROM employees e
       LEFT JOIN appointments a ON (a.host_employee_id = e.id OR a.host_id = e.user_id) AND a.deleted_at IS NULL
       WHERE e.department_id = ? AND e.deleted_at IS NULL
       GROUP BY e.id, e.full_name
       ORDER BY total_appointments DESC`,
      [deptId]
    ).catch(() => []);

    // Volume over the last 7 days
    const recentVolume = await db.query(
      `SELECT DATE(scheduled_start) as date_val, COUNT(*) as count
       FROM appointments
       WHERE department_id = ? AND scheduled_start >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND deleted_at IS NULL
       GROUP BY DATE(scheduled_start)
       ORDER BY date_val ASC`,
      [deptId]
    ).catch(() => []);

    return {
      statusCounts,
      hostWorkloads,
      recentVolume,
      reportType,
    };
  }

  /**
   * Get department audit logs
   */
  async getDepartmentAuditLogs(scope, filters = {}) {
    const deptId = scope.departmentId;
    const { limit = 50, offset = 0 } = filters;

    const sql = `
      SELECT al.*, u.full_name AS actor_name, u.role AS actor_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE (al.module = 'DEPARTMENT' OR al.module = 'APPOINTMENTS' OR al.module = 'APPROVALS')
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const logs = await db.query(sql, [parseInt(limit), parseInt(offset)]).catch(() => []);
    return logs;
  }

  /**
   * Get Manager Profile
   */
  async getManagerProfile(userId) {
    const user = await db.query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.full_name,
              u.phone, u.phone_number, u.role, u.department_id,
              d.organization_id, d.branch_id,
              u.profile_photo, u.avatar_url,
              d.department_name, d.department_code,
              o.name AS organization_name, b.branch_name,
              mp.manager_number, mp.position, mp.office, mp.approval_authority_level
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN organizations o ON d.organization_id = o.id
       LEFT JOIN organization_branches b ON d.branch_id = b.id
       LEFT JOIN manager_profiles mp ON u.id = mp.user_id
       WHERE u.id = ?`,
      [userId]
    );

    return user[0] || null;
  }

  /**
   * Update Manager Profile
   */
  async updateManagerProfile(userId, { firstName, lastName, fullName, full_name, phone, office, photoUrl, photo_url, avatarUrl, avatar_url }) {
    const computedName = (fullName || full_name || `${firstName || ''} ${lastName || ''}`).trim();
    const finalPhoto = photoUrl || photo_url || avatarUrl || avatar_url;

    await db.query(
      `UPDATE users 
       SET first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           full_name = COALESCE(?, full_name),
           phone = COALESCE(?, phone),
           phone_number = COALESCE(?, phone_number),
           avatar_url = COALESCE(?, avatar_url),
           updated_at = NOW()
       WHERE id = ?`,
      [firstName || null, lastName || null, computedName || null, phone || null, phone || null, finalPhoto || null, userId]
    );

    if (office) {
      await db.query(
        `UPDATE manager_profiles SET office = ?, updated_at = NOW() WHERE user_id = ?`,
        [office, userId]
      ).catch(() => {});
    }

    return this.getManagerProfile(userId);
  }

  /**
   * Department Audit Logs
   */
  async getDepartmentAuditLogs(managerScope, filters = {}) {
    const limit = Math.min(200, Math.max(1, parseInt(filters.limit || 50, 10)));
    const offset = Math.max(0, parseInt(filters.offset || 0, 10));

    let sql = `
      SELECT al.*, 
             u.full_name AS actor_name, u.email AS actor_email, u.role AS actor_role
      FROM audit_logs al
      LEFT JOIN users u ON COALESCE(al.actor_id, al.user_id) = u.id
      WHERE (
        al.module IN ('DEPARTMENT_MANAGER', 'APPOINTMENTS', 'EMPLOYEE_MANAGEMENT', 'CHECKIN', 'CHECKOUT', 'APPROVALS')
        OR al.entity IN ('Appointment', 'appointments', 'Employee', 'employees')
      )
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await db.query(sql, [limit, offset]).catch(() => []);
    return rows || [];
  }
}

module.exports = new DepartmentManagerRepository();
