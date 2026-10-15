const departmentStatisticsService = require('../services/department-statistics.service');

class DepartmentStatisticsController {
  async getOverview(req, res, next) {
    try {
      const stats = await departmentStatisticsService.getOverview();
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DepartmentStatisticsController();
