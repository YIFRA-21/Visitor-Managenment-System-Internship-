const approvalRepository = require('../repositories/approval.repository');
const appointmentRepository = require('../../appointment-management/repositories/appointment.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const notificationService = require('../../notifications/services/notification.service');
const db = require('../../../config/db');
const { AppError } = require('../../../middleware/errorHandler');

class ApprovalService {
  async initializeWorkflow(appointmentId, departmentId, hostId, tx = null) {
    const workflow = await approvalRepository.getWorkflowForDepartment(departmentId).catch(() => null);
    
    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
      // Assign default single-level host approval step (assigned to hostId)
      await approvalRepository.create({
        appointmentId,
        approverId: hostId,
        approvalLevel: 1,
        stepId: null,
        slaMinutes: 1440,
      }, tx);

      const queryExec = (sql, params) => (tx ? tx.query(sql, params) : db.query(sql, params));
      await queryExec(
        `UPDATE appointments SET approval_status = 'PENDING', appointment_status = 'REQUESTED', status = 'PENDING', current_approval_level = 1 WHERE id = ?`,
        [appointmentId]
      );
      return;
    }

    // Assign level 1 approval step
    const step1 = workflow.steps[0];
    const approverId = step1.approver_id || hostId; // default to host if not specified

    await approvalRepository.create({
      appointmentId,
      approverId,
      approvalLevel: 1,
      stepId: step1.id,
      slaMinutes: step1.sla_minutes,
    }, tx);

    const queryExec = (sql, params) => (tx ? tx.query(sql, params) : db.query(sql, params));
    await queryExec(
      `UPDATE appointments SET approval_status = 'PENDING', appointment_status = 'REQUESTED', status = 'PENDING', current_approval_level = 1 WHERE id = ?`,
      [appointmentId]
    );
  }

  async processDecision(approvalId, decision, comments = null, operatorUserId) {
    const approval = await approvalRepository.findById(approvalId);
    if (!approval) {
      throw new AppError('Approval record not found', 404);
    }
    if (approval.decision !== 'PENDING') {
      throw new AppError('This approval step has already been processed', 400);
    }

    // Verify permission: operator must be designated approver, admin, or department manager
    let isAuthorized = approval.approver_id === operatorUserId;
    if (!isAuthorized && operatorUserId) {
      try {
        const uRows = await db.query('SELECT id, role, department_id FROM users WHERE id = ?', [operatorUserId]);
        const user = uRows && uRows[0];
        if (user) {
          if (['admin', 'org_admin', 'system_administrator'].includes(user.role)) {
            isAuthorized = true;
          } else {
            const empRows = await db.query('SELECT id, user_id, department_id FROM employees WHERE user_id = ? OR id = ?', [operatorUserId, operatorUserId]).catch(() => []);
            if (empRows.some(e => e.id === approval.approver_id || e.user_id === approval.approver_id)) {
              isAuthorized = true;
            } else if (['manager', 'department_manager'].includes(user.role)) {
              const targetAppt = await appointmentRepository.findById(approval.appointment_id);
              if (!targetAppt || !targetAppt.department_id || targetAppt.department_id === user.department_id || empRows.some(e => e.department_id === targetAppt.department_id)) {
                isAuthorized = true;
              }
            }
          }
        }
      } catch (err) {
        console.warn('[ApprovalService] Auth verification check warning:', err.message);
      }
    }

    if (!isAuthorized) {
      throw new AppError('You are not authorized to approve/reject this request', 403);
    }

    const appointment = await appointmentRepository.findById(approval.appointment_id);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    await db.transaction(async (tx) => {
      // 1. Update decision for the current step
      await tx.execute(
        `UPDATE appointment_approvals 
         SET decision = ?, comments = ?, decided_at = CURRENT_TIMESTAMP, updated_by = ? 
         WHERE id = ?`,
        [decision, comments, operatorUserId, approvalId]
      );

      // 2. Action based on decision
      if (decision === 'REJECTED') {
        // Cancel appointment
        await tx.execute(
          `UPDATE appointments 
           SET approval_status = 'REJECTED', appointment_status = 'REJECTED', status = 'rejected' 
           WHERE id = ?`,
          [appointment.id]
        );

        if (appointment.visitor_id) {
          await tx.execute(
            `UPDATE visitors SET registration_status = 'REJECTED', status = 'REJECTED' WHERE id = ?`,
            [appointment.visitor_id]
          );
        }

        // Cancel any remaining steps
        await tx.execute(
          `UPDATE appointment_approvals 
           SET decision = 'BYPASSED' 
           WHERE appointment_id = ? AND decision = 'PENDING'`,
          [appointment.id]
        );

        // Notify visitor & emit domain event
        try {
          await notificationService.notifyVisitorStatus(appointment.id, 'REJECTED');
        } catch (e) {}
        try {
          const EventBus = require('../../../events/EventBus');
          EventBus.emitDomainEvent('APPT_REJECTED', {
            appointmentId: appointment.id,
            visitorId: appointment.visitor_id,
            host_employee_id: appointment.host_id,
            reference_code: appointment.reference_code,
            comments
          });
        } catch (e) {}
      } else if (decision === 'APPROVED') {
        // Find next workflow step
        const workflow = await approvalRepository.getWorkflowForDepartment(appointment.department_id);
        const currentLevel = approval.approval_level;
        const nextStep = workflow?.steps.find((s) => s.level === currentLevel + 1);

        if (nextStep) {
          // Trigger next level
          const nextApproverId = nextStep.approver_id || appointment.host_id;

          await tx.execute(
            `INSERT INTO appointment_approvals (appointment_id, approver_id, approval_level, step_id, sla_minutes, decision) 
             VALUES (?, ?, ?, ?, ?, 'PENDING')`,
            [appointment.id, nextApproverId, currentLevel + 1, nextStep.id, nextStep.sla_minutes]
          );

          await tx.execute(
            `UPDATE appointments SET current_approval_level = ? WHERE id = ?`,
            [currentLevel + 1, appointment.id]
          );
        } else {
          // Final approval achieved!
          await tx.execute(
            `UPDATE appointments 
             SET approval_status = 'APPROVED', appointment_status = 'APPROVED', status = 'approved' 
             WHERE id = ?`,
            [appointment.id]
          );

          if (appointment.visitor_id) {
            await tx.execute(
              `UPDATE visitors SET registration_status = 'APPROVED', status = 'ACTIVE' WHERE id = ?`,
              [appointment.visitor_id]
            );
          }

          // Generate digital pass & notify visitor
          try {
            await notificationService.notifyVisitorStatus(appointment.id, 'APPROVED');
          } catch (e) {}
          try {
            const EventBus = require('../../../events/EventBus');
            EventBus.emitDomainEvent('APPT_APPROVED', {
              appointmentId: appointment.id,
              visitorId: appointment.visitor_id,
              host_employee_id: appointment.host_id,
              reference_code: appointment.reference_code
            });
          } catch (e) {}
        }
      }

    });

    await auditRepository.log({
      userId: operatorUserId,
      action: `APPROVAL_${decision}`,
      module: 'APPROVALS',
      entity: 'appointments',
      recordId: appointment.id,
      newValues: { approvalId, decision },
    });
  }

  async listPendingApprovals(userId, userRole) {
    return approvalRepository.findPendingByApprover(userId, userRole);
  }
}

module.exports = new ApprovalService();
