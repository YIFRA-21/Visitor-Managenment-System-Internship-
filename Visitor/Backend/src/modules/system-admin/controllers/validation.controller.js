const validationService = require('../services/validation.service');

class ValidationController {
  async runAudit(req, res, next) {
    try {
      const organizationId = req.query?.organizationId || req.query?.org_id || 1;
      const branchId = req.query?.branchId || null;
      const report = await validationService.runAudit(organizationId, branchId);
      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ValidationController();
