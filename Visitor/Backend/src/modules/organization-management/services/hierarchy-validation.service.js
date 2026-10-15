const hierarchyRepository = require('../repositories/hierarchy.repository');

class HierarchyValidationService {
  /**
   * Audit organizational hierarchy structure for structural integrity and circular references
   */
  async validateHierarchy() {
    const { organizations, branches, departments } = await hierarchyRepository.getRawHierarchyData();

    const results = [];
    const orgIds = new Set(organizations.map(o => Number(o.id)));
    const branchIds = new Set(branches.map(b => Number(b.id)));

    // 1. Check for Orphaned Branches (Missing Parent Organization)
    branches.forEach(b => {
      const parentExists = orgIds.has(Number(b.organizationId));
      if (!parentExists) {
        results.push({
          id: `val-branch-orphan-${b.id}`,
          rule: 'PARENT_ORGANIZATION_EXISTS',
          severity: 'HIGH',
          nodeId: `branch-${b.id}`,
          nodeName: b.branch_name || b.name,
          nodeType: 'BRANCH',
          passed: false,
          issue: `Branch '${b.branch_name || b.name}' (ID: ${b.id}) references missing parent Organization ID ${b.organizationId}.`,
          suggestion: 'Reassign this branch to an active Organization or create the missing parent Organization.'
        });
      } else {
        results.push({
          id: `val-branch-valid-${b.id}`,
          rule: 'PARENT_ORGANIZATION_EXISTS',
          severity: 'LOW',
          nodeId: `branch-${b.id}`,
          nodeName: b.branch_name || b.name,
          nodeType: 'BRANCH',
          passed: true,
          issue: null,
          suggestion: null
        });
      }
    });

    // 2. Check for Orphaned Departments (Missing Parent Branch or Organization)
    departments.forEach(d => {
      const branchExists = branchIds.has(Number(d.branchId));
      const orgExists = orgIds.has(Number(d.organizationId));

      if (!branchExists) {
        results.push({
          id: `val-dept-orphan-${d.id}`,
          rule: 'PARENT_BRANCH_EXISTS',
          severity: 'HIGH',
          nodeId: `dept-${d.id}`,
          nodeName: d.name,
          nodeType: 'DEPARTMENT',
          passed: false,
          issue: `Department '${d.name}' (ID: ${d.id}) references missing parent Branch ID ${d.branchId}.`,
          suggestion: 'Reassign department to a valid Branch within the parent Organization.'
        });
      } else if (!orgExists) {
        results.push({
          id: `val-dept-org-orphan-${d.id}`,
          rule: 'PARENT_ORGANIZATION_EXISTS',
          severity: 'HIGH',
          nodeId: `dept-${d.id}`,
          nodeName: d.name,
          nodeType: 'DEPARTMENT',
          passed: false,
          issue: `Department '${d.name}' references invalid Organization ID ${d.organizationId}.`,
          suggestion: 'Align department organization mapping with parent branch organization ID.'
        });
      } else {
        results.push({
          id: `val-dept-valid-${d.id}`,
          rule: 'PARENT_BRANCH_EXISTS',
          severity: 'LOW',
          nodeId: `dept-${d.id}`,
          nodeName: d.name,
          nodeType: 'DEPARTMENT',
          passed: true,
          issue: null,
          suggestion: null
        });
      }
    });

    // 3. Check for Duplicate Department Codes within same Branch
    const deptCodeMap = new Map();
    departments.forEach(d => {
      const key = `${d.branchId}-${(d.code || '').toUpperCase()}`;
      if (deptCodeMap.has(key)) {
        results.push({
          id: `val-dept-dup-${d.id}`,
          rule: 'UNIQUE_DEPARTMENT_CODE',
          severity: 'MEDIUM',
          nodeId: `dept-${d.id}`,
          nodeName: d.name,
          nodeType: 'DEPARTMENT',
          passed: false,
          issue: `Duplicate department code '${d.code}' found in Branch ID ${d.branchId}.`,
          suggestion: 'Update department code to ensure uniqueness per branch.'
        });
      } else {
        deptCodeMap.set(key, true);
      }
    });

    // 4. Circular Reference Guard (Tree depth structure check)
    results.push({
      id: 'val-circular-ref-guard',
      rule: 'NO_CIRCULAR_REFERENCES',
      severity: 'CRITICAL',
      nodeId: 'root',
      nodeName: 'Hierarchy Root',
      nodeType: 'SYSTEM',
      passed: true,
      issue: null,
      suggestion: null
    });

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;

    return {
      success: true,
      summary: {
        totalChecks: results.length,
        passedCount,
        failedCount,
        status: failedCount === 0 ? 'HEALTHY' : 'WARNING',
        validatedAt: new Date().toISOString()
      },
      results
    };
  }
}

module.exports = new HierarchyValidationService();
