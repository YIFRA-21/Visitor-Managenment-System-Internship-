const hierarchyService = require('../services/hierarchy.service');

class HierarchyAssignmentController {
  async assign(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      const result = await hierarchyService.assignHierarchy(req.body, userRole);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async updateAssign(req, res, next) {
    try {
      const userRole = req.user?.role || 'admin';
      const payload = { ...req.body, id: req.params.id };
      const result = await hierarchyService.assignHierarchy(payload, userRole);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HierarchyAssignmentController();
