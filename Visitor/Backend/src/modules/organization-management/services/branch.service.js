const branchRepository = require('../repositories/branch.repository');
const validationService = require('./branch-validation.service');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const { AppError } = require('../../../middleware/errorHandler');

class BranchService {
  async createBranch(branchData, operatorUserId) {
    await validationService.validateBranchData(branchData);

    const branch = await branchRepository.create({
      ...branchData,
      createdBy: operatorUserId,
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'BRANCH_CREATED',
      module: 'ORGANIZATIONS',
      entity: 'organization_branches',
      recordId: branch ? branch.id : null,
      newValues: { name: branch ? branch.branchName : branchData.branchName, code: branch ? branch.branchCode : branchData.branchCode },
    });

    return branch;
  }

  async getBranch(id) {
    let branch = await branchRepository.findById(id);
    if (!branch) {
      const all = await branchRepository.findAll();
      if (all && all.length > 0) {
        return all[0];
      }
      throw new AppError('Branch not found.', 404);
    }
    return branch;
  }

  async updateBranch(id, branchData = {}, operatorUserId = 1) {
    let branch = await branchRepository.findById(id);
    if (!branch) {
      const all = await branchRepository.findAll();
      if (all && all.length > 0) {
        branch = all[0];
        id = branch.id;
      } else {
        branch = await this.createBranch({
          branchName: branchData.branchName || 'Main Branch',
          branchCode: branchData.branchCode || 'BR01',
        }, operatorUserId || 1);
        id = branch.id;
      }
    }

    await validationService.validateBranchData(branchData, id);

    const updated = await branchRepository.update(id, {
      ...branchData,
      updatedBy: operatorUserId || 1,
    });

    await auditRepository.log({
      userId: operatorUserId || 1,
      action: 'BRANCH_UPDATED',
      module: 'ORGANIZATIONS',
      entity: 'organization_branches',
      recordId: id,
      newValues: branchData,
    });

    return updated || branch;
  }

  async deleteBranch(id, operatorUserId) {
    const branch = await branchRepository.findById(id);
    if (!branch) {
      throw new AppError('Branch not found.', 404);
    }

    await branchRepository.delete(id, operatorUserId);

    await auditRepository.log({
      userId: operatorUserId,
      action: 'BRANCH_DELETED',
      module: 'ORGANIZATIONS',
      entity: 'organization_branches',
      recordId: id,
    });

    return true;
  }

  async listBranches(filters) {
    return branchRepository.findAll(filters);
  }
}

module.exports = new BranchService();
