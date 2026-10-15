const validationService = require('../services/hierarchy-validation.service');

class HierarchyValidationController {
  async validate(req, res, next) {
    try {
      const report = await validationService.validateHierarchy();
      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HierarchyValidationController();
