const statisticsService = require('../services/branch-statistics.service');

class BranchStatisticsController {
  async getStatistics(req, res, next) {
    try {
      const stats = await statisticsService.getBranchStatistics();
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BranchStatisticsController();
