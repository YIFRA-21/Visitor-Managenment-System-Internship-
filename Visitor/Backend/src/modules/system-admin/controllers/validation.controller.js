const validationService = require('../services/validation.service');

class ValidationController {
  async runAudit(req, res, next) {
    try {
      const { organizationId, branchId } = req.query;
      if (!organizationId) {
        return res.status(400).json({ error: 'organizationId parameter is required to run calendar audit.' });
      }
      const report = await validationService.runAudit(organizationId, branchId || null);
      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ValidationController();
