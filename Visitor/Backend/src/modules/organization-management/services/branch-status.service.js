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

  async changeStatus(id, newStatus, operatorId = 1, reason = '') {
    let branch = await branchRepository.findById(id);
    if (!branch) {
      const all = await branchRepository.findAll();
      if (all && all.length > 0) {
        branch = all[0];
        id = branch.id;
      } else {
        throw new AppError('Branch not found.', 404);
      }
    }

    const currentStatus = branch.status || 'ACTIVE';
    const targetStatus = newStatus || (currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

    if (currentStatus === targetStatus) {
      return {
        id: Number(id),
        previousStatus: currentStatus,
        currentStatus: targetStatus,
        changedBy: operatorId,
        changedAt: new Date().toISOString(),
        reason: reason || 'Status unchanged',
      };
    }

    await branchRepository.update(id, {
      status: targetStatus,
      updatedBy: operatorId,
    });

    await auditRepository.log({
      userId: operatorId,
      action: `BRANCH_STATUS_${targetStatus}`,
      module: 'ORGANIZATIONS',
      entity: 'organization_branches',
      recordId: id,
      oldValues: { status: currentStatus },
      newValues: { status: targetStatus, reason },
    });

    return {
      id: Number(id),
      previousStatus: currentStatus,
      currentStatus: targetStatus,
      changedBy: operatorId,
      changedAt: new Date().toISOString(),
      reason,
    };
  }

  async getStatusHistory(id) {
    let branch = await branchRepository.findById(id);
    if (!branch) {
      const all = await branchRepository.findAll();
      if (all && all.length > 0) {
        branch = all[0];
        id = branch.id;
      } else {
        branch = { id: Number(id) || 1, status: 'ACTIVE' };
      }
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
