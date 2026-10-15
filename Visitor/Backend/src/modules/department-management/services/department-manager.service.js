const departmentManagerRepository = require('../repositories/department-manager.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const notificationService = require('../../notifications/services/notification.service');

class DepartmentManagerService {
  /**
   * 1. Overview KPIs, queue, workload & stats
   */
  async getOverview(managerScope) {
    return departmentManagerRepository.getOverviewStats(managerScope);
  }

  /**
   * 2. Department Employees
   */
  async getEmployees(managerScope, filters) {
    return departmentManagerRepository.getDepartmentEmployees(managerScope, filters);
  }

  /**
   * 3. Toggle host status & update employee availability / limits
   */
  async updateHostStatus(managerScope, employeeId, data, managerUserId) {
    const updated = await departmentManagerRepository.updateHostStatus(managerScope, employeeId, data);
    if (!updated) {
      throw new Error('Employee not found in your assigned department.');
    }

    // Audit log
    await auditRepository.log({
      userId: managerUserId,
      action: 'HOST_STATUS_UPDATE',
      module: 'DEPARTMENT_MANAGER',
      entity: 'employees',
      recordId: employeeId,
      newValues: data,
      details: `Manager updated host status for employee #${employeeId} (${updated.full_name})`
    }).catch(err => console.error('Audit log failed:', err.message));

    return updated;
  }

  /**
   * 4. Host availability
   */
  async getHostAvailability(managerScope) {
    return departmentManagerRepository.getHostAvailability(managerScope);
  }

  /**
   * 5. Visitor requests (with filters for status, reassignment needed, etc.)
   */
  async getVisitorRequests(managerScope, filters) {
    return departmentManagerRepository.getDepartmentVisitorRequests(managerScope, filters);
  }

  /**
   * 6. Request details with approval history
   */
  async getRequestDetails(managerScope, appointmentId) {
    const details = await departmentManagerRepository.getRequestDetails(managerScope, appointmentId);
    if (!details) {
      throw new Error('Visitor request not found in your assigned department.');
    }
    return details;
  }

  /**
   * 7. Alternative hosts in department
   */
  async getAlternativeHosts(managerScope, currentHostId) {
    return departmentManagerRepository.getAlternativeHosts(managerScope, currentHostId);
  }

  /**
   * 8. Reassign Host workflow
   */
  async reassignHost(managerScope, appointmentId, { newHostEmployeeId, reason, urgentNotification }, managerUserId) {
    if (!newHostEmployeeId) {
      throw new Error('Target host employee ID is required.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('A reason for host reassignment is required.');
    }

    const result = await departmentManagerRepository.reassignHost(
      managerScope,
      appointmentId,
      newHostEmployeeId,
      reason,
      managerUserId
    );

    // 1. Audit Log
    await auditRepository.log({
      userId: managerUserId,
      action: 'HOST_REASSIGNED',
      module: 'DEPARTMENT_MANAGER',
      entity: 'appointments',
      recordId: appointmentId,
      oldValues: { host_employee_id: result.previousHost?.id, host_name: result.previousHost?.full_name },
      newValues: { host_employee_id: result.newHost?.id, host_name: result.newHost?.full_name, reason },
      details: `Host reassigned for appointment #${appointmentId} from ${result.previousHost?.full_name || 'Previous Host'} to ${result.newHost?.full_name}. Reason: ${reason}`
    }).catch(err => console.error('Audit log failed:', err.message));

    // 2. Multi-channel Notifications
    try {
      // Notify New Host
      if (result.newHost?.user_id) {
        await notificationService.dispatchBusinessNotification('APPT_HOST_ASSIGNED', result.newHost.user_id, {
          title: 'Visitor Request Assigned to You',
          message: `You have been reassigned as host for an upcoming visitor appointment (#${result.appointmentNumber || appointmentId}). Reason: ${reason}`,
          reference_number: result.appointmentNumber,
          record_id: appointmentId,
          priority: urgentNotification ? 'urgent' : 'high',
          module_name: 'APPOINTMENTS'
        });
      }

      // Notify Previous Host
      if (result.previousHost?.user_id) {
        await notificationService.dispatchBusinessNotification('APPT_HOST_REASSIGNED', result.previousHost.user_id, {
          title: 'Visitor Request Reassigned',
          message: `Your visitor appointment (#${result.appointmentNumber || appointmentId}) has been reassigned to ${result.newHost.full_name} by the Department Manager. Reason: ${reason}`,
          reference_number: result.appointmentNumber,
          record_id: appointmentId,
          priority: 'medium',
          module_name: 'APPOINTMENTS'
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch reassignment notifications:', notifErr.message);
    }

    return result;
  }

  /**
   * 8b. Assign Available Host & Route for Employee Approval
   */
  async assignHostAndRoute(managerScope, appointmentId, payload, managerUserId) {
    const { hostEmployeeId, instructions = '' } = payload;
    const result = await departmentManagerRepository.assignHostAndRoute(
      managerScope,
      appointmentId,
      managerUserId,
      { hostEmployeeId, instructions }
    );

    // Audit log
    await auditRepository.log({
      userId: managerUserId,
      action: 'HOST_ASSIGNED_BY_MANAGER',
      module: 'DEPARTMENT_MANAGER',
      entity: 'appointments',
      recordId: appointmentId,
      newValues: {
        host_employee_id: result.assignedHost.id,
        host_user_id: result.assignedHost.user_id,
        approval_status: 'PENDING_HOST_APPROVAL',
        instructions
      },
      details: `Department Manager assigned ${result.assignedHost.full_name} as host for appointment #${appointmentId} and forwarded for host approval.`
    }).catch(err => console.error('Audit log failed:', err.message));

    // Dispatch real-time notification to the assigned host employee
    try {
      if (result.assignedHost.user_id) {
        await notificationService.dispatchBusinessNotification('HOST_ASSIGNED', result.assignedHost.user_id, {
          appointmentId,
          record_id: appointmentId,
          title: 'New Visitor Assigned for Approval',
          message: `Department Manager assigned visitor "${result.visitorName}" (#${result.appointmentNumber}) to you for review and approval.${instructions ? ` Note: ${instructions}` : ''}`,
          url: '/employee/requests',
        }, result.assignedHost.email);
      }
    } catch (notifErr) {
      console.error('Failed to notify assigned host employee:', notifErr.message);
    }

    return result;
  }

  /**
   * 9. Approve Request
   */
  async approveRequest(managerScope, appointmentId, comments, managerUserId) {
    const appt = await departmentManagerRepository.approveRequest(managerScope, appointmentId, managerUserId, comments);

    // Audit log
    await auditRepository.log({
      userId: managerUserId,
      action: 'APPROVAL_APPROVED',
      module: 'DEPARTMENT_MANAGER',
      entity: 'appointments',
      recordId: appointmentId,
      newValues: { approval_status: 'APPROVED', comments },
      details: `Department Manager approved appointment #${appointmentId}`
    }).catch(err => console.error('Audit log failed:', err.message));

    // Notify
    try {
      await notificationService.dispatchBusinessNotification('APPT_APPROVED', null, {
        appointmentId,
        record_id: appointmentId,
        title: 'Visitor Request Approved',
        message: `Your visit request (#${appt.appointment_number}) has been approved by the department manager.`
      }, appt.visitor_email);
    } catch (e) {}

    return appt;
  }

  /**
   * 10. Reject Request
   */
  async rejectRequest(managerScope, appointmentId, reason, managerUserId) {
    const appt = await departmentManagerRepository.rejectRequest(managerScope, appointmentId, managerUserId, reason);

    // Audit log
    await auditRepository.log({
      userId: managerUserId,
      action: 'APPROVAL_REJECTED',
      module: 'DEPARTMENT_MANAGER',
      entity: 'appointments',
      recordId: appointmentId,
      newValues: { approval_status: 'REJECTED', reason },
      details: `Department Manager rejected appointment #${appointmentId}. Reason: ${reason}`
    }).catch(err => console.error('Audit log failed:', err.message));

    // Notify
    try {
      await notificationService.dispatchBusinessNotification('APPT_REJECTED', null, {
        appointmentId,
        record_id: appointmentId,
        title: 'Visitor Request Declined',
        message: `Your visit request (#${appt.appointment_number}) was declined. Reason: ${reason}`
      }, appt.visitor_email);
    } catch (e) {}

    return appt;
  }

  /**
   * 11. Appointments list / calendar
   */
  async getAppointments(managerScope, filters) {
    return departmentManagerRepository.getDepartmentAppointments(managerScope, filters);
  }

  /**
   * 12. Department Visitors
   */
  async getDepartmentVisitors(managerScope, filters) {
    return departmentManagerRepository.getDepartmentVisitors(managerScope, filters);
  }

  /**
   * 13. Reports Overview & Analytics
   */
  async getReports(managerScope, reportType) {
    return departmentManagerRepository.getDepartmentReports(managerScope, reportType);
  }

  /**
   * 14. Export Data (CSV formatted)
   */
  async getExportData(managerScope, exportType) {
    if (exportType === 'VISITORS') {
      const { visitors } = await departmentManagerRepository.getDepartmentVisitors(managerScope, { limit: 1000 });
      return visitors;
    }
    if (exportType === 'EMPLOYEES') {
      return departmentManagerRepository.getDepartmentEmployees(managerScope);
    }
    // Default: Appointments / Requests
    return departmentManagerRepository.getDepartmentAppointments(managerScope, { timeFilter: 'ALL' });
  }

  /**
   * 15. Audit Logs
   */
  async getAuditLogs(managerScope, filters) {
    return departmentManagerRepository.getDepartmentAuditLogs(managerScope, filters);
  }

  /**
   * 16. Profile & Settings
   */
  async getProfile(userId) {
    return departmentManagerRepository.getManagerProfile(userId);
  }

  async updateProfile(userId, profileData) {
    return departmentManagerRepository.updateManagerProfile(userId, profileData);
  }

  /**
   * 17. Department Meeting Rooms & Spaces
   */
  async getRooms(managerScope) {
    const db = require('../../../config/db');
    const rooms = await db.query(
      `SELECT r.*, 
              (SELECT COUNT(*) FROM appointments a WHERE a.room_id = r.id AND a.department_id = ? AND a.scheduled_date = CURDATE()) as today_bookings_count
       FROM rooms r 
       WHERE r.is_active = 1
       ORDER BY r.name ASC`,
      [managerScope.departmentId]
    ).catch(() => []);

    const bookings = await db.query(
      `SELECT a.id, a.reference_code, a.scheduled_date, a.scheduled_start, a.scheduled_end, a.purpose, a.status,
              r.name as room_name, r.id as room_id,
              v.full_name as visitor_name, e.full_name as host_name
       FROM appointments a
       JOIN rooms r ON a.room_id = r.id
       LEFT JOIN visitors v ON a.visitor_id = v.id
       LEFT JOIN employees e ON a.host_employee_id = e.id
       WHERE a.department_id = ? AND a.scheduled_date >= CURDATE()
       ORDER BY a.scheduled_date ASC, a.scheduled_start ASC LIMIT 20`,
      [managerScope.departmentId]
    ).catch(() => []);

    return { rooms, bookings };
  }

  async bookRoom(managerScope, bookingData, userId) {
    const db = require('../../../config/db');
    const { roomId, appointmentId, notes } = bookingData;
    if (appointmentId && roomId) {
      await db.query(`UPDATE appointments SET room_id = ? WHERE id = ? AND department_id = ?`, [roomId, appointmentId, managerScope.departmentId]);
    }
    await auditRepository.log({
      userId,
      action: 'ROOM_BOOKING',
      module: 'DEPARTMENT_MANAGER',
      entity: 'rooms',
      recordId: roomId,
      newValues: bookingData,
      details: `Manager assigned meeting room #${roomId} for appointment #${appointmentId || 'N/A'}`
    }).catch(() => {});
    return { success: true, message: 'Room booked successfully' };
  }

  /**
   * 18. Department Hosting Policies & Rules
   */
  async getPolicies(managerScope) {
    const db = require('../../../config/db');
    const rows = await db.query(
      `SELECT setting_key, setting_value FROM department_settings WHERE department_id = ?`,
      [managerScope.departmentId]
    ).catch(() => []);

    const settingsMap = {};
    for (const r of rows) settingsMap[r.setting_key] = r.setting_value;

    return {
      departmentId: managerScope.departmentId,
      departmentName: managerScope.departmentName,
      maxVisitorsPerHostPerDay: parseInt(settingsMap.max_visitors_per_host_day || '5', 10),
      maxConcurrentVisitors: parseInt(settingsMap.max_concurrent_visitors || '3', 10),
      advanceNoticeHours: parseInt(settingsMap.advance_notice_hours || '2', 10),
      escalationTimeoutHours: parseInt(settingsMap.escalation_timeout_hours || '2', 10),
      requireManagerApprovalVip: settingsMap.require_manager_vip === 'true' || settingsMap.require_manager_vip === '1',
      requireManagerApprovalContractor: settingsMap.require_manager_contractor !== 'false',
      requireEscortAllVisitors: settingsMap.require_escort_all === 'true' || settingsMap.require_escort_all === '1',
      allowWeekendVisits: settingsMap.allow_weekend_visits === 'true' || settingsMap.allow_weekend_visits === '1',
      dailyDepartmentVisitorCap: parseInt(settingsMap.daily_department_cap || '50', 10)
    };
  }

  async updatePolicies(managerScope, policyData, userId) {
    const db = require('../../../config/db');
    const entries = [
      ['max_visitors_per_host_day', String(policyData.maxVisitorsPerHostPerDay || 5)],
      ['max_concurrent_visitors', String(policyData.maxConcurrentVisitors || 3)],
      ['advance_notice_hours', String(policyData.advanceNoticeHours || 2)],
      ['escalation_timeout_hours', String(policyData.escalationTimeoutHours || 2)],
      ['require_manager_vip', policyData.requireManagerApprovalVip ? '1' : '0'],
      ['require_manager_contractor', policyData.requireManagerApprovalContractor ? '1' : '0'],
      ['require_escort_all', policyData.requireEscortAllVisitors ? '1' : '0'],
      ['allow_weekend_visits', policyData.allowWeekendVisits ? '1' : '0'],
      ['daily_department_cap', String(policyData.dailyDepartmentVisitorCap || 50)]
    ];

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS department_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          department_id INT NOT NULL,
          setting_key VARCHAR(100) NOT NULL,
          setting_value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_dept_key (department_id, setting_key)
        )
      `);
      for (const [k, v] of entries) {
        await db.query(
          `INSERT INTO department_settings (department_id, setting_key, setting_value) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [managerScope.departmentId, k, v, v]
        );
      }
    } catch (e) {
      console.warn('department_settings table update note:', e.message);
    }

    await auditRepository.log({
      userId,
      action: 'POLICY_UPDATE',
      module: 'DEPARTMENT_MANAGER',
      entity: 'department_settings',
      recordId: managerScope.departmentId,
      newValues: policyData,
      details: `Manager updated hosting policies for ${managerScope.departmentName}`
    }).catch(() => {});

    return this.getPolicies(managerScope);
  }

  /**
   * 19. Emergency Evacuation & Roll Call
   */
  async getEvacuationRoster(managerScope) {
    const db = require('../../../config/db');
    const employees = await db.query(
      `SELECT e.id, e.full_name, e.job_title, e.email, e.mobile_number, e.availability_status
       FROM employees e 
       WHERE e.department_id = ? AND e.employment_status = 'ACTIVE'
       ORDER BY e.full_name ASC`,
      [managerScope.departmentId]
    ).catch(() => []);

    const visitors = await db.query(
      `SELECT v.id as visitor_id, v.full_name as visitor_name, v.company as visitor_company,
              a.id as appointment_id, a.reference_code, a.status as visit_status,
              e.full_name as host_name, a.scheduled_start
       FROM appointments a
       JOIN visitors v ON a.visitor_id = v.id
       LEFT JOIN employees e ON a.host_employee_id = e.id
       WHERE a.department_id = ? AND a.scheduled_date = CURDATE() AND a.status IN ('CHECKED_IN', 'IN_MEETING', 'OVERSTAY')
       ORDER BY a.scheduled_start ASC`,
      [managerScope.departmentId]
    ).catch(() => []);

    return {
      departmentName: managerScope.departmentName,
      totalHeadcount: employees.length + visitors.length,
      employeesCount: employees.length,
      activeVisitorsCount: visitors.length,
      employees: employees.map(e => ({ ...e, musterStatus: 'ACCOUNTED' })),
      visitors: visitors.map(v => ({ ...v, musterStatus: 'ACCOUNTED' }))
    };
  }

  /**
   * 20. Department Security & Restricted Zones
   */
  async getSecurityZones(managerScope) {
    const defaultZones = [
      { id: 1, name: 'Department Reception & Lobby', zoneCode: 'Z-REC', restrictionLevel: 'PUBLIC', escortRequired: false, activeVisitorsCount: 2, status: 'SECURE' },
      { id: 2, name: 'General Staff Office Area', zoneCode: 'Z-OFF', restrictionLevel: 'STAFF_ONLY', escortRequired: true, activeVisitorsCount: 1, status: 'SECURE' },
      { id: 3, name: 'Executive Meeting Suites', zoneCode: 'Z-EXEC', restrictionLevel: 'RESTRICTED', escortRequired: true, activeVisitorsCount: 0, status: 'SECURE' },
      { id: 4, name: 'Department Data & Server Closet', zoneCode: 'Z-SRV', restrictionLevel: 'HIGH_SECURITY', escortRequired: true, activeVisitorsCount: 0, status: 'LOCKED' },
    ];
    return {
      departmentName: managerScope.departmentName,
      zones: defaultZones,
      activeEscortAlerts: 0,
      securityOfficerOnDuty: { name: 'Officer Desta T.', phone: '+251 911 234 567', post: 'Station B-2' }
    };
  }
}

module.exports = new DepartmentManagerService();
