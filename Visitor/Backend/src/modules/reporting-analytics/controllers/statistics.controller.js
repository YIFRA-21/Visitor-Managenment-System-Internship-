const statisticsService = require('../services/statistics.service');

class StatisticsController {
  async getStats(req, res, next) {
    try {
      const organizationId = req.query?.organizationId || req.query?.org_id || 1;
      const branchId = req.query?.branchId || null;
      const data = await statisticsService.getStatistics(organizationId, branchId);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StatisticsController();
