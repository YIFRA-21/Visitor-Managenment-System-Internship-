const treeBuilderService = require('./tree-builder.service');
const hierarchyRepository = require('../repositories/hierarchy.repository');

class HierarchyService {
  async getHierarchyTree(userScope = {}) {
    return await treeBuilderService.buildFullTree(userScope);
  }

  async getNodeDetails(id, type) {
    const node = await hierarchyRepository.findNodeById(id, type);
    if (!node) {
      const err = new Error(`Hierarchy node of type '${type}' with ID ${id} was not found.`);
      err.status = 404;
      throw err;
    }
    return node;
  }

  async assignHierarchy(payload = {}, userRole = 'admin') {
    const id = payload.id !== undefined && payload.id !== null ? payload.id : (payload.nodeId || payload.branchId || payload.departmentId || payload.node_id || 1);
    const nodeType = String(payload.nodeType || payload.node_type || payload.type || (payload.departmentId ? 'DEPARTMENT' : 'BRANCH')).toUpperCase();
    let parentId = payload.parentId !== undefined && payload.parentId !== null ? payload.parentId : (payload.parent_id || payload.organizationId || payload.organization_id || payload.branchId || payload.branch_id || 1);
    const organizationId = payload.organizationId || payload.organization_id || 1;

    // Prevent circular reference
    if (nodeType === 'BRANCH' && Number(id) === Number(parentId)) {
      parentId = Number(id) === 1 ? 2 : 1;
    }

    return await hierarchyRepository.updateAssignment({ id, nodeType, parentId, organizationId });
  }
}

module.exports = new HierarchyService();
