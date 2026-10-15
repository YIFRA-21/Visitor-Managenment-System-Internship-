const orgStatisticsService = require('../services/org-statistics.service');

class OrgStatisticsController {
  async getSummary(req, res, next) {
    try {
      const stats = await orgStatisticsService.getStatsSummary(req.params.id || 1);
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrgStatisticsController();
