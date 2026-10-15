const hierarchyRepository = require('../repositories/hierarchy.repository');

class HierarchySearchService {
  async searchHierarchy(query = {}) {
    const {
      name, code, nodeType, status, organizationId, branchId,
      page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC'
    } = query;

    const { organizations, branches, departments } = await hierarchyRepository.getRawHierarchyData();

    let allNodes = [];

    // Flatten all nodes into searchable items
    organizations.forEach(o => {
      allNodes.push({
        id: `org-${o.id}`,
        numericId: o.id,
        name: o.name,
        code: o.code || `ORG-${o.id}`,
        nodeType: 'ORGANIZATION',
        level: 1,
        organizationName: o.name,
        branchName: 'N/A',
        status: o.status || 'ACTIVE',
        created_at: o.created_at
      });
    });

    branches.forEach(b => {
      allNodes.push({
        id: `branch-${b.id}`,
        numericId: b.id,
        name: b.name,
        code: b.code || `BR-${b.id}`,
        nodeType: 'BRANCH',
        level: 2,
        organizationId: b.organizationId,
        organizationName: b.organizationName || 'N/A',
        branchName: b.name,
        status: b.status || 'ACTIVE',
        created_at: b.created_at
      });
    });

    departments.forEach(d => {
      allNodes.push({
        id: `dept-${d.id}`,
        numericId: d.id,
        name: d.name,
        code: d.code || `DEPT-${d.id}`,
        nodeType: 'DEPARTMENT',
        level: 3,
        organizationId: d.organizationId,
        branchId: d.branchId,
        organizationName: d.organizationName || 'N/A',
        branchName: d.branchName || 'N/A',
        status: d.status || 'ACTIVE',
        created_at: d.created_at
      });
    });

    // Filtering
    if (name && name.trim()) {
      const q = name.trim().toLowerCase();
      allNodes = allNodes.filter(n => n.name.toLowerCase().includes(q));
    }
    if (code && code.trim()) {
      const c = code.trim().toLowerCase();
      allNodes = allNodes.filter(n => n.code.toLowerCase().includes(c));
    }
    if (nodeType && nodeType.trim() && nodeType.toUpperCase() !== 'ALL') {
      allNodes = allNodes.filter(n => n.nodeType === nodeType.trim().toUpperCase());
    }
    if (status && status.trim() && status.toUpperCase() !== 'ALL') {
      allNodes = allNodes.filter(n => n.status.toUpperCase() === status.trim().toUpperCase());
    }
    if (organizationId) {
      allNodes = allNodes.filter(n => n.organizationId === Number(organizationId) || (n.nodeType === 'ORGANIZATION' && n.numericId === Number(organizationId)));
    }
    if (branchId) {
      allNodes = allNodes.filter(n => n.branchId === Number(branchId) || (n.nodeType === 'BRANCH' && n.numericId === Number(branchId)));
    }

    // Sorting
    allNodes.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder.toUpperCase() === 'DESC' ? 1 : -1;
      if (valA > valB) return sortOrder.toUpperCase() === 'DESC' ? -1 : 1;
      return 0;
    });

    // Pagination
    const totalCount = allNodes.length;
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Number(limit));
    const start = (p - 1) * l;
    const paginated = allNodes.slice(start, start + l);

    return {
      data: paginated,
      pagination: {
        page: p,
        limit: l,
        totalCount,
        totalPages: Math.ceil(totalCount / l)
      }
    };
  }
}

module.exports = new HierarchySearchService();
