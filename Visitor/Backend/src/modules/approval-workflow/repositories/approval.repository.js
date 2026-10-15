const db = require('../../../config/db');

class ApprovalRepository {
  async findById(id) {
    const rows = await db.query(
      `SELECT ap.*, u.full_name as approverName, u.email as approverEmail
       FROM appointment_approvals ap
       LEFT JOIN users u ON ap.approver_id = u.id
       WHERE ap.id = ? AND ap.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  }

  async findByAppointmentId(appointmentId) {
    return db.query(
      `SELECT ap.*, u.full_name as approverName, u.email as approverEmail,
              d.full_name as delegatedToName
       FROM appointment_approvals ap
       LEFT JOIN users u ON ap.approver_id = u.id
       LEFT JOIN users d ON ap.delegated_to_id = d.id
       WHERE ap.appointment_id = ? AND ap.deleted_at IS NULL
       ORDER BY ap.approval_level ASC`,
      [appointmentId]
    );
  }

  async getWorkflowForDepartment(departmentId) {
    const workflows = await db.query(
      `SELECT * FROM approval_workflows 
       WHERE department_id = ? AND is_active = TRUE AND deleted_at IS NULL 
       LIMIT 1`,
      [departmentId]
    );
    const workflow = workflows[0] || null;

    if (!workflow) return null;

    const steps = await db.query(
      `SELECT * FROM approval_steps 
       WHERE workflow_id = ? AND is_active = TRUE AND deleted_at IS NULL
       ORDER BY level ASC`,
      [workflow.id]
    );

    workflow.steps = steps;
    return workflow;
  }

  async create(approvalData, tx = null) {
    const queryExec = (sql, params) => (tx ? tx.query(sql, params) : db.query(sql, params));

    const {
      appointmentId,
      approverId,
      approvalLevel,
      stepId = null,
      slaMinutes = null,
    } = approvalData;

    const slaDueAt = slaMinutes
      ? new Date(Date.now() + slaMinutes * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      : null;

    const result = await queryExec(
      `INSERT INTO appointment_approvals (
        appointment_id, approver_id, approval_level, decision, step_id, sla_due_at
      ) VALUES (?, ?, ?, 'PENDING', ?, ?)`,
      [appointmentId, approverId, approvalLevel, stepId, slaDueAt]
    );

    const approvalId = result.insertId;

    // Sync approval_id alias
    await queryExec(
      `UPDATE appointment_approvals SET approval_id = ? WHERE id = ?`,
      [approvalId, approvalId]
    );

    return approvalId;
  }

  async updateDecision(id, decision, comments = null, userId = null) {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return db.query(
      `UPDATE appointment_approvals 
       SET decision = ?, comments = ?, decided_at = ?, updated_by = ? 
       WHERE id = ?`,
      [decision, comments, now, userId, id]
    );
  }

  async findPendingByApprover(userId, userRole) {
    // Find approvals where either the approver is specifically this user,
    // or the step is mapped to a role that matches the user's role.
    return db.query(
      `SELECT ap.*, a.appointment_number as appointmentNumber, a.purpose,
              v.full_name as visitorName, v.company as visitorCompany,
              a.scheduled_start as scheduledStart, a.scheduled_end as scheduledEnd
       FROM appointment_approvals ap
       JOIN appointments a ON ap.appointment_id = a.id
       JOIN visitors v ON a.visitor_id = v.id
       LEFT JOIN approval_steps s ON ap.step_id = s.id
       WHERE ap.decision = 'PENDING' 
         AND ap.deleted_at IS NULL
         AND a.deleted_at IS NULL
         AND (
           ap.approver_id = ? 
           OR (s.approver_role = ? AND ap.approver_id IS NULL)
         )`,
      [userId, userRole]
    );
  }
}

module.exports = new ApprovalRepository();
