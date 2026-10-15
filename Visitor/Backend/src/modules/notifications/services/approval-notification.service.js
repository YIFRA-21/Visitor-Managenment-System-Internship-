// src/services/manager/ApprovalNotificationService.js
// Manager Approval Service with workflow execution and audit logging

const ManagerApprovalRepository = require('../../approval-workflow/repositories/manager-approval.repository');
const { auditLog } = require('../../../utils/audit');

class ApprovalNotificationService {
  async getPendingApprovals(scope) {
    return await ManagerApprovalRepository.getPendingApprovals(scope);
  }

  async getApprovalDetails(id, scope) {
    const approval = await ManagerApprovalRepository.getApprovalById(id, scope);
    if (!approval) throw new Error('Approval request not found or unauthorized access');
    return approval;
  }

  async approveRequest(id, comments, scope) {
    const approval = await ManagerApprovalRepository.updateApprovalStatus(id, 'approved', comments, scope);
    await auditLog({
      userId: scope.managerId,
      entity: 'manager_approval',
      action: 'approve_request',
      details: { id, comments, requestType: approval.requestType }
    });
    return approval;
  }

  async rejectRequest(id, comments, scope) {
    const approval = await ManagerApprovalRepository.updateApprovalStatus(id, 'rejected', comments, scope);
    await auditLog({
      userId: scope.managerId,
      entity: 'manager_approval',
      action: 'reject_request',
      details: { id, comments, requestType: approval.requestType }
    });
    return approval;
  }

  async returnForRevision(id, comments, scope) {
    const approval = await ManagerApprovalRepository.updateApprovalStatus(id, 'revision_requested', comments, scope);
    await auditLog({
      userId: scope.managerId,
      entity: 'manager_approval',
      action: 'revision_requested',
      details: { id, comments }
    });
    return approval;
  }

  async forwardApproval(id, targetManagerId, comments, scope) {
    const approval = await ManagerApprovalRepository.getApprovalById(id, scope);
    if (!approval) throw new Error('Approval request not found');

    approval.history.push({
      step: 'FORWARDED',
      actor: `Manager (${scope.managerId})`,
      timestamp: new Date().toISOString(),
      notes: `Forwarded to Manager ID ${targetManagerId}. Notes: ${comments || 'N/A'}`
    });

    await auditLog({
      userId: scope.managerId,
      entity: 'manager_approval',
      action: 'forward_approval',
      details: { id, targetManagerId, comments }
    });

    return approval;
  }
}

module.exports = new ApprovalNotificationService();
