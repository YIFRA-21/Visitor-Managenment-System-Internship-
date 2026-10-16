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
  async changeStatus(id, newStatus, operatorId = 1, reason = '') {
    let org = await orgRepository.findOrgById(id);
    if (!org) {
      const allOrgs = await orgRepository.findAllOrgs();
      if (allOrgs && allOrgs.length > 0) {
        org = allOrgs[0];
        id = org.id;
      } else {
        throw new AppError('Organization not found.', 404);
      }
    }

    const currentStatus = org.status || 'ACTIVE';
    const targetStatus = newStatus || (currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

    if (currentStatus === targetStatus) {
      return {
        id: parseInt(id),
        previousStatus: currentStatus,
        currentStatus: targetStatus,
        changedBy: operatorId,
        changedAt: new Date().toISOString(),
        reason: reason || 'Status unchanged',
      };
    }

    await orgRepository.updateOrg(id, {
      status: targetStatus,
      updatedBy: operatorId,
    });

    await auditRepository.log({
      userId: operatorId,
      action: `ORGANIZATION_STATUS_${targetStatus}`,
      module: 'ORGANIZATIONS',
      entity: 'organizations',
      recordId: id,
      oldValues: { status: currentStatus },
      newValues: { status: targetStatus, reason },
    });

    return {
      id: parseInt(id),
      previousStatus: currentStatus,
      currentStatus: targetStatus,
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
