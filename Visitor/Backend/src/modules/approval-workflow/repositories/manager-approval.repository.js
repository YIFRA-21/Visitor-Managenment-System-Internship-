const db = require('../../../config/db');

class ManagerApprovalRepository {
  async getPendingApprovals(scope = {}) {
    const managerDeptId = scope.departmentId || scope.department_id;
    const managerOrgId = scope.organizationId || scope.organization_id || 1;

    try {
      const rows = await db.query(
        `SELECT a.id, a.reference_code, a.purpose, a.scheduled_start, a.scheduled_end,
                a.status, a.approval_status, a.created_at, a.remarks,
                v.full_name as visitor_name, v.email as visitor_email, v.phone as visitor_phone,
                v.company as visitor_company, v.photo_url as visitor_photo,
                COALESCE(u.full_name, e.full_name, 'Host Employee') as host_name,
                d.name as department_name, b.branch_name
         FROM appointments a
         LEFT JOIN visitors v ON a.visitor_id = v.id
         LEFT JOIN employees e ON a.host_employee_id = e.id
         LEFT JOIN users u ON a.host_user_id = u.id
         LEFT JOIN departments d ON a.department_id = d.id
         LEFT JOIN organization_branches b ON a.branch_id = b.id
         WHERE (a.department_id = ? OR e.department_id = ?)
           AND (a.organization_id = ? OR 1=1)
           AND a.deleted_at IS NULL
         ORDER BY a.created_at DESC`,
        [managerDeptId || 1, managerDeptId || 1, managerOrgId || 1]
      );

      return rows.map(r => ({
        id: r.id,
        requestType: 'Visitor Appointment Request',
        visitorName: r.visitor_name || 'Visitor',
        visitorEmail: r.visitor_email,
        company: r.visitor_company || 'Corporate Guest',
        hostName: r.host_name,
        departmentId: managerDeptId,
        departmentName: r.department_name || 'Department',
        branchName: r.branch_name || 'Main Branch',
        requestedDate: r.scheduled_start ? String(r.scheduled_start).slice(0, 10) : '2026-08-12',
        requestedTime: r.scheduled_start ? String(r.scheduled_start).slice(11, 16) : '09:00',
        reason: r.purpose || 'Official Business Meeting',
        riskLevel: 'Standard',
        status: (r.status || r.approval_status || 'PENDING').toLowerCase(),
        referenceCode: r.reference_code || `VMS-2026-${r.id}`
      }));
    } catch (err) {
      console.error('ManagerApprovalRepository.getPendingApprovals Error:', err);
      return [];
    }
  }

  async getApprovalById(id, scope = {}) {
    const list = await this.getPendingApprovals(scope);
    return list.find(a => String(a.id) === String(id) || a.referenceCode === id) || null;
  }

  async updateApprovalStatus(id, newStatus, comments = '', scope = {}) {
    const statusUpper = (newStatus || 'APPROVED').toUpperCase();
    await db.query(
      `UPDATE appointments SET status = ?, approval_status = ?, remarks = ? WHERE id = ? OR reference_code = ?`,
      [statusUpper, statusUpper, comments, id, id]
    );

    await db.query(
      `UPDATE appointment_approvals SET decision = ?, comments = ?, decided_at = NOW() WHERE appointment_id = ?`,
      [statusUpper, comments, id]
    ).catch(() => []);

    return this.getApprovalById(id, scope);
  }
}

module.exports = new ManagerApprovalRepository();
