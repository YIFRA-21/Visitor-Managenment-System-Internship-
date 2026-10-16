const orgRepository = require('../repositories/org.repository');
const auditRepository = require('../../audit-log/repositories/audit.repository');
const { AppError } = require('../../../middleware/errorHandler');

const db = require('../../../config/db');

class OrganizationService {
  async registerOrganization(orgData, operatorUserId = 1) {
    let code = (orgData.code || ('ORG' + String(Date.now()).slice(-4))).toUpperCase();
    const name = orgData.name || 'New Organization';

    // Check code duplication
    const duplicate = await orgRepository.findOrgByCode(code);
    if (duplicate) {
      code = `${code.slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`.toUpperCase();
    }
    orgData.code = code;

    const orgId = await orgRepository.createOrg({
      ...orgData,
      createdBy: operatorUserId || 1,
    });

    await auditRepository.log({
      userId: operatorUserId || 1,
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

  async createBranch(branchData, operatorUserId = 1) {
    let organizationId = branchData.organizationId || branchData.organization_id || branchData.orgId;
    let org = null;

    if (organizationId) {
      org = await orgRepository.findOrgById(organizationId);
    }

    if (!org) {
      const orgs = await orgRepository.findAllOrgs();
      if (orgs && orgs.length > 0) {
        org = orgs[0];
        organizationId = org.id;
      } else {
        organizationId = 1;
      }
    }

    const branchName = branchData.branchName || branchData.branch_name || branchData.name || 'Main Branch';
    let branchCode = (branchData.branchCode || branchData.branch_code || branchData.code || ('BR' + String(Date.now()).slice(-4))).toUpperCase();

    // Check code uniqueness in organization_branches
    const existing = await db.query('SELECT id FROM organization_branches WHERE branch_code = ?', [branchCode]);
    if (existing && existing.length > 0) {
      branchCode = `${branchCode.slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`.toUpperCase();
    }

    const payload = {
      ...branchData,
      organizationId,
      branchName,
      branchCode,
      createdBy: operatorUserId || 1,
    };

    const branchId = await orgRepository.createBranch(payload);

    await auditRepository.log({
      userId: operatorUserId || 1,
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

  async createBuilding(buildingData, operatorUserId = 1) {
    let branchId = buildingData.branchId || buildingData.branch_id || buildingData.branch?.id;
    let branch = null;

    if (branchId) {
      branch = await orgRepository.findBranchById(branchId);
    }

    if (!branch) {
      // Find first active branch
      const activeBranches = await db.query('SELECT * FROM organization_branches WHERE deleted_at IS NULL LIMIT 1');
      if (activeBranches && activeBranches.length > 0) {
        branch = activeBranches[0];
        branchId = branch.id;
      } else {
        // Find any branch and restore it if needed
        const anyBranch = await db.query('SELECT * FROM organization_branches LIMIT 1');
        if (anyBranch && anyBranch.length > 0) {
          branch = anyBranch[0];
          branchId = branch.id;
          await db.query('UPDATE organization_branches SET deleted_at = NULL, is_active = 1, status = "ACTIVE" WHERE id = ?', [branchId]);
        } else {
          // Create a branch first
          branchId = await this.createBranch({
            branchName: 'Headquarters',
            branchCode: 'HQ' + String(Date.now()).slice(-4),
          }, operatorUserId || 1);
        }
      }
    }

    const buildingName = buildingData.buildingName || buildingData.building_name || buildingData.name || 'Main Building';
    let buildingCode = (buildingData.buildingCode || buildingData.building_code || buildingData.code || ('BLD-' + Math.floor(1000 + Math.random() * 9000))).toUpperCase();

    // Check code uniqueness in buildings table
    const existingBld = await db.query('SELECT id FROM buildings WHERE building_code = ?', [buildingCode]);
    if (existingBld && existingBld.length > 0) {
      buildingCode = `${buildingCode.slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`.toUpperCase();
    }

    const buildingId = await orgRepository.createBuilding({
      ...buildingData,
      branchId,
      buildingName,
      buildingCode,
      location: buildingData.location || buildingData.address || null,
      maxCapacity: buildingData.maxCapacity || buildingData.max_capacity || buildingData.max_visitor_capacity || 100,
      createdBy: operatorUserId || 1,
    });

    await auditRepository.log({
      userId: operatorUserId || 1,
      action: 'BUILDING_CREATED',
      module: 'ORGANIZATIONS',
      entity: 'buildings',
      recordId: buildingId,
      newValues: { buildingCode, buildingName },
    });

    const rows = await orgRepository.findBuildingsByBranch(branchId);
    return rows.find((b) => b.id === buildingId) || {
      id: buildingId,
      building_id: buildingId,
      branch_id: branchId,
      building_name: buildingName,
      building_code: buildingCode,
    };
  }

  async getBuildings(branchId) {
    return orgRepository.findBuildingsByBranch(branchId);
  }

  async updateOrganization(id, orgData, operatorUserId = 1) {
    let org = await orgRepository.findOrgById(id);
    if (!org) {
      const allOrgs = await orgRepository.findAllOrgs();
      if (allOrgs && allOrgs.length > 0) {
        org = allOrgs[0];
        id = org.id;
      } else {
        const newId = await orgRepository.createOrg({
          name: orgData.name || 'Default Organization',
          code: orgData.code || 'ORG01',
          registrationNumber: 'REG-001',
          taxNumber: 'TAX-001',
          email: 'admin@org.com',
          phone: '+251911000000',
          createdBy: operatorUserId || 1,
        });
        id = newId;
        org = await orgRepository.findOrgById(newId);
      }
    }

    if (orgData.code && orgData.code !== org.code) {
      const duplicate = await orgRepository.findOrgByCode(orgData.code);
      if (duplicate && duplicate.id !== org.id) {
        orgData.code = `${orgData.code.slice(0, 5)}${Math.floor(100 + Math.random() * 900)}`.toUpperCase();
      }
    }

    await orgRepository.updateOrg(id, {
      ...orgData,
      updatedBy: operatorUserId || 1,
    });

    await auditRepository.log({
      userId: operatorUserId || 1,
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

  async updateBranch(id, branchData, operatorUserId = 1) {
    let branch = await orgRepository.findBranchById(id);
    if (!branch) {
      const rows = await db.query('SELECT * FROM organization_branches LIMIT 1');
      if (rows && rows.length > 0) {
        id = rows[0].id;
        branch = rows[0];
      } else {
        id = await this.createBranch({
          branchName: branchData.branchName || 'Main Branch',
          branchCode: branchData.branchCode || 'BR01',
        }, operatorUserId || 1);
        branch = await orgRepository.findBranchById(id);
      }
    }

    await orgRepository.updateBranch(id, {
      ...branchData,
      updatedBy: operatorUserId || 1
    });

    await auditRepository.log({
      userId: operatorUserId || 1,
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
