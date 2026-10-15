const hierarchyService = require('../services/hierarchy.service');

class HierarchyController {
  async getTree(req, res, next) {
    try {
      const userScope = {
        role: req.user?.role,
        organizationId: req.user?.organization_id,
        departmentId: req.user?.department_id
      };
      const result = await hierarchyService.getHierarchyTree(userScope);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getNode(req, res, next) {
    try {
      const { id } = req.params;
      const { type = 'ORGANIZATION' } = req.query;
      const node = await hierarchyService.getNodeDetails(id, type.toUpperCase());
      res.status(200).json(node);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HierarchyController();
