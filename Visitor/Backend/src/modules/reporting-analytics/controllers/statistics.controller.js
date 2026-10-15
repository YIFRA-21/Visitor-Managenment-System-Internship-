const statisticsService = require('../services/statistics.service');

class StatisticsController {
  async getStats(req, res, next) {
    try {
      const { organizationId, branchId } = req.query;
      if (!organizationId) {
        return res.status(400).json({ error: 'organizationId parameter is required.' });
      }
      const data = await statisticsService.getStatistics(organizationId, branchId || null);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StatisticsController();
