const hierarchyRepository = require('../repositories/hierarchy.repository');

class HierarchyStatisticsService {
  async getStatistics() {
    const { organizations, branches, departments } = await hierarchyRepository.getRawHierarchyData();

    const activeOrgs = organizations.filter(o => (o.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const activeBranches = branches.filter(b => (b.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const activeDepts = departments.filter(d => (d.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;

    // Organization Distribution by Branch Count
    const orgBranchDist = organizations.map(o => {
      const bCount = branches.filter(b => b.organizationId === o.id).length;
      return {
        organizationId: o.id,
        organizationName: o.name,
        branchCount: bCount
      };
    });

    // Branch Distribution by Department Count
    const branchDeptDist = branches.map(b => {
      const dCount = departments.filter(d => d.branchId === b.id).length;
      return {
        branchId: b.id,
        branchName: b.name,
        departmentCount: dCount
      };
    });

    return {
      success: true,
      summary: {
        totalOrganizations: organizations.length,
        totalBranches: branches.length,
        totalDepartments: departments.length,
        maxHierarchyLevels: 3,
        totalActiveUnits: activeOrgs + activeBranches + activeDepts,
        activeOrganizations: activeOrgs,
        activeBranches: activeBranches,
        activeDepartments: activeDepts
      },
      distributions: {
        organizationBranchDistribution: orgBranchDist,
        branchDepartmentDistribution: branchDeptDist
      }
    };
  }
}

module.exports = new HierarchyStatisticsService();
