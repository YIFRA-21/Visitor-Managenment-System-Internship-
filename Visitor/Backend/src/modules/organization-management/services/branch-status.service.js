const branchRepository = require('../repositories/branch.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const { AppError } = require('../../../middleware/errorHandler');

class BranchStatusService {
  static TRANSITIONS = {
    ACTIVE: ['INACTIVE', 'SUSPENDED'],
    INACTIVE: ['ACTIVE'],
    SUSPENDED: ['ACTIVE', 'INACTIVE'],
    ARCHIVED: ['ACTIVE'],
  };

  async changeStatus(id, newStatus, operatorId, reason = '') {
    const branch = await branchRepository.findById(id);
    if (!branch) {
      throw new AppError('Branch not found.', 404);
    }

    const currentStatus = branch.status || 'ACTIVE';
    const validTargets = BranchStatusService.TRANSITIONS[currentStatus] || [];

    if (!validTargets.includes(newStatus)) {
      throw new AppError(
        `Invalid branch status transition: ${currentStatus} → ${newStatus}. ` +
        `Allowed transitions: ${validTargets.join(', ') || 'none'}.`,
        400
      );
    }

    await branchRepository.update(id, {
      status: newStatus,
      updatedBy: operatorId,
    });

    await auditRepository.log({
      userId: operatorId,
      action: `BRANCH_STATUS_${newStatus}`,
      module: 'ORGANIZATIONS',
      entity: 'organization_branches',
      recordId: id,
      oldValues: { status: currentStatus },
      newValues: { status: newStatus, reason },
    });

    return {
      id: Number(id),
      previousStatus: currentStatus,
      currentStatus: newStatus,
      changedBy: operatorId,
      changedAt: new Date().toISOString(),
      reason,
    };
  }

  async getStatusHistory(id) {
    const branch = await branchRepository.findById(id);
    if (!branch) {
      throw new AppError('Branch not found.', 404);
    }

    const history = await branchRepository.findBranchStatusHistory(id);

    return {
      branchId: Number(id),
      currentStatus: branch.status || 'ACTIVE',
      history,
    };
  }
}

module.exports = new BranchStatusService();
