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

  async assignHierarchy(payload, userRole) {
    if (userRole !== 'admin' && userRole !== 'system_administrator') {
      const err = new Error('Access Denied: Only System Administrators can configure hierarchy assignments.');
      err.status = 403;
      throw err;
    }

    const { id, nodeType, parentId, organizationId } = payload;
    if (!id || !nodeType || !parentId) {
      const err = new Error('Node ID, nodeType, and parentId are required for hierarchy assignment.');
      err.status = 400;
      throw err;
    }

    // Circular reference check (Child cannot be its own parent)
    if (nodeType === 'BRANCH' && Number(id) === Number(parentId)) {
      const err = new Error('Circular Reference Error: A branch cannot be assigned as its own parent.');
      err.status = 400;
      throw err;
    }

    return await hierarchyRepository.updateAssignment({ id, nodeType, parentId, organizationId });
  }
}

module.exports = new HierarchyService();
