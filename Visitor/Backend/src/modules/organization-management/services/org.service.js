const orgRepository = require('../repositories/org.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const { AppError } = require('../../../middleware/errorHandler');

class OrganizationService {
  async registerOrganization(orgData, operatorUserId) {
    const { code, name } = orgData;

    // Check code duplication
    const duplicate = await orgRepository.findOrgByCode(code);
    if (duplicate) {
      throw new AppError(`Organization code '${code}' is already registered.`, 400);
    }

    const orgId = await orgRepository.createOrg({
      ...orgData,
      createdBy: operatorUserId,
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_REGISTERED',
      module: 'ORGANIZATIONS',
      entity: 'organizations',
      recordId: orgId,
      newValues: { code, name },
    });

    return orgRepository.findOrgById(orgId);
  }

  async listOrganizations(filters) {
    return orgRepository.findAllOrgs(filters);
  }

  async getOrganization(id) {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }
    return org;
  }

  async createBranch(branchData, operatorUserId) {
    const { branchCode, branchName, organizationId } = branchData;

    // Verify org exists
    const org = await orgRepository.findOrgById(organizationId);
    if (!org) {
      throw new AppError('Parent Organization not found', 404);
    }

    const branchId = await orgRepository.createBranch({
      ...branchData,
      createdBy: operatorUserId,
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_BRANCH_CREATED',
      module: 'ORGANIZATIONS',
      entity: 'organization_branches',
      recordId: branchId,
      newValues: { branchCode, branchName },
    });

    return orgRepository.findBranchById(branchId);
  }

  async getBranches(orgId) {
    return orgRepository.findBranchesByOrg(orgId);
  }

  async createBuilding(buildingData, operatorUserId) {
    const { branchId, buildingName, buildingCode } = buildingData;

    // Verify branch exists
    const branch = await orgRepository.findBranchById(branchId);
    if (!branch) {
      throw new AppError('Parent Branch site not found', 404);
    }

    const buildingId = await orgRepository.createBuilding({
      ...buildingData,
      createdBy: operatorUserId,
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'BUILDING_CREATED',
      module: 'ORGANIZATIONS',
      entity: 'buildings',
      recordId: buildingId,
      newValues: { buildingCode, buildingName },
    });

    // Return the building
    const rows = await orgRepository.findBuildingsByBranch(branchId);
    return rows.find((b) => b.id === buildingId);
  }

  async getBuildings(branchId) {
    return orgRepository.findBuildingsByBranch(branchId);
  }

  async updateOrganization(id, orgData, operatorUserId) {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    if (orgData.code && orgData.code !== org.code) {
      const duplicate = await orgRepository.findOrgByCode(orgData.code);
      if (duplicate) {
        throw new AppError(`Organization code '${orgData.code}' is already registered.`, 400);
      }
    }

    await orgRepository.updateOrg(id, {
      ...orgData,
      updatedBy: operatorUserId
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_UPDATED',
      module: 'ORGANIZATIONS',
      entity: 'organizations',
      recordId: id,
      newValues: orgData
    });

    return orgRepository.findOrgById(id);
  }

  async archiveOrganization(id, operatorUserId) {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    await orgRepository.softDeleteOrg(id, operatorUserId);

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_ARCHIVED',
      module: 'ORGANIZATIONS',
      entity: 'organizations',
      recordId: id
    });

    return true;
  }

  async restoreOrganization(id, operatorUserId) {
    await orgRepository.restoreOrg(id);

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_RESTORED',
      module: 'ORGANIZATIONS',
      entity: 'organizations',
      recordId: id
    });

    return orgRepository.findOrgById(id);
  }

  async activateOrganization(id, operatorUserId) {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    await orgRepository.updateOrg(id, { status: 'ACTIVE', updatedBy: operatorUserId });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_ACTIVATED',
      module: 'ORGANIZATIONS',
      entity: 'organizations',
      recordId: id
    });

    return true;
  }

  async deactivateOrganization(id, operatorUserId) {
    const org = await orgRepository.findOrgById(id);
    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    await orgRepository.updateOrg(id, { status: 'INACTIVE', updatedBy: operatorUserId });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_DEACTIVATED',
      module: 'ORGANIZATIONS',
      entity: 'organizations',
      recordId: id
    });

    return true;
  }

  async updateBranch(id, branchData, operatorUserId) {
    const branch = await orgRepository.findBranchById(id);
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }

    await orgRepository.updateBranch(id, {
      ...branchData,
      updatedBy: operatorUserId
    });

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_BRANCH_UPDATED',
      module: 'ORGANIZATIONS',
      entity: 'organization_branches',
      recordId: id,
      newValues: branchData
    });

    return orgRepository.findBranchById(id);
  }

  async deleteBranch(id, operatorUserId) {
    const branch = await orgRepository.findBranchById(id);
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }

    await orgRepository.softDeleteBranch(id, operatorUserId);

    await auditRepository.log({
      userId: operatorUserId,
      action: 'ORGANIZATION_BRANCH_DELETED',
      module: 'ORGANIZATIONS',
      entity: 'organization_branches',
      recordId: id
    });

    return true;
  }
}

module.exports = new OrganizationService();
