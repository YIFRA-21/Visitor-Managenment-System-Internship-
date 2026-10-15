const statisticsService = require('../services/hierarchy-statistics.service');

class HierarchyStatisticsController {
  async getStatistics(req, res, next) {
    try {
      const stats = await statisticsService.getStatistics();
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HierarchyStatisticsController();
