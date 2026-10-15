const orgRepository = require('../repositories/org.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const { AppError } = require('../../../middleware/errorHandler');

class OrganizationStatusService {
  /**
   * Valid status transitions map.
   * Key = current status, Value = array of allowed target statuses.
   */
  static TRANSITIONS = {
    ACTIVE: ['INACTIVE', 'SUSPENDED'],
    INACTIVE: ['ACTIVE'],
    SUSPENDED: ['ACTIVE', 'INACTIVE'],
    ARCHIVED: ['ACTIVE'],
  };

  /**
   * Change an organization's status with validation and audit logging.
   * @param {number} id - Organization ID
   * @param {string} newStatus - Target status
   * @param {number} operatorId - User performing the action
   * @param {string} [reason] - Optional reason for the change
   */
  async changeStatus(id, newStatus, operatorId, reason = '') {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    const currentStatus = org.status || 'ACTIVE';
    const validTargets = OrganizationStatusService.TRANSITIONS[currentStatus] || [];

    if (!validTargets.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Allowed transitions: ${validTargets.join(', ') || 'none'}.`,
        400
      );
    }

    await orgRepository.updateOrg(id, {
      status: newStatus,
      updatedBy: operatorId,
    });

    await auditRepository.log({
      userId: operatorId,
      action: `ORGANIZATION_STATUS_${newStatus}`,
      module: 'ORGANIZATIONS',
      entity: 'organizations',
      recordId: id,
      oldValues: { status: currentStatus },
      newValues: { status: newStatus, reason },
    });

    return {
      id: parseInt(id),
      previousStatus: currentStatus,
      currentStatus: newStatus,
      changedBy: operatorId,
      changedAt: new Date().toISOString(),
      reason,
    };
  }

  /**
   * Get status change history for an organization.
   * Returns mock data until audit_logs table is queryable.
   * @param {number} id - Organization ID
   */
  async getStatusHistory(id) {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    // Attempt to get real history from audit logs
    const history = await orgRepository.findOrgStatusHistory(id);

    return {
      organizationId: parseInt(id),
      currentStatus: org.status || 'ACTIVE',
      history,
    };
  }

  /**
   * Get the current status information for an organization.
   * @param {number} id - Organization ID
   */
  async getCurrentStatus(id) {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    return {
      id: parseInt(id),
      name: org.name,
      code: org.code,
      currentStatus: org.status || 'ACTIVE',
      lastUpdated: org.updated_at || org.created_at || new Date().toISOString(),
      allowedTransitions: OrganizationStatusService.TRANSITIONS[org.status || 'ACTIVE'] || [],
    };
  }
}

module.exports = new OrganizationStatusService();
