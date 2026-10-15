const hierarchyRepository = require('../repositories/hierarchy.repository');

class TreeBuilderService {
  /**
   * Build complete organizational hierarchy tree
   */
  async buildFullTree(userScope = {}) {
    const rawData = await hierarchyRepository.getRawHierarchyData();
    const { organizations, branches, departments } = rawData;

    // Build department lookup grouped by branchId
    const deptMap = new Map();
    departments.forEach(dept => {
      const bId = Number(dept.branchId || dept.branch_id);
      if (!deptMap.has(bId)) deptMap.set(bId, []);
      deptMap.get(bId).push({
        id: `dept-${dept.id}`,
        numericId: dept.id,
        name: dept.name || dept.department_name,
        code: dept.code || dept.department_code,
        type: 'DEPARTMENT',
        deptType: dept.type || dept.department_type || 'GENERAL',
        location: dept.location || dept.office_location || 'N/A',
        status: dept.status || 'ACTIVE',
        level: 3,
        children: []
      });
    });

    // Build branch lookup grouped by organizationId
    const branchMap = new Map();
    branches.forEach(branch => {
      const oId = Number(branch.organizationId || branch.organization_id);
      if (!branchMap.has(oId)) branchMap.set(oId, []);
      const bDepts = deptMap.get(Number(branch.id)) || [];
      branchMap.get(oId).push({
        id: `branch-${branch.id}`,
        numericId: branch.id,
        name: branch.name || branch.branch_name,
        code: branch.code || branch.branch_code,
        type: 'BRANCH',
        branchType: branch.type || branch.branch_type || 'OFFICE',
        city: branch.city || 'N/A',
        status: branch.status || 'ACTIVE',
        level: 2,
        children: bDepts
      });
    });

    // Build organization root nodes
    let tree = organizations.map(org => {
      const orgBranches = branchMap.get(Number(org.id)) || [];
      return {
        id: `org-${org.id}`,
        numericId: org.id,
        name: org.name,
        code: org.code || `ORG-${org.id}`,
        type: 'ORGANIZATION',
        status: org.status || 'ACTIVE',
        level: 1,
        children: orgBranches
      };
    });

    // Apply role-based scoping if user role is not admin
    if (userScope.role === 'organization_admin' && userScope.organizationId) {
      tree = tree.filter(node => node.numericId === Number(userScope.organizationId));
    } else if (userScope.role === 'department_manager' && userScope.departmentId) {
      // Filter tree down to branch/department of manager
      tree = tree.map(org => ({
        ...org,
        children: org.children.map(b => ({
          ...b,
          children: b.children.filter(d => d.numericId === Number(userScope.departmentId))
        })).filter(b => b.children.length > 0)
      })).filter(org => org.children.length > 0);
    }

    return {
      tree,
      meta: {
        totalOrganizations: tree.length,
        totalBranches: branches.length,
        totalDepartments: departments.length,
        maxDepth: 3,
        generatedAt: new Date().toISOString()
      }
    };
  }
}

module.exports = new TreeBuilderService();
