const dashboardService = require('../services/dashboard.service');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const data = await dashboardService.getDashboardStats(req.user);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getActivities(req, res, next) {
    try {
      const data = await dashboardService.getActivities();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getLayout(req, res, next) {
    try {
      const data = await dashboardService.getLayout(req.user.id);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async saveLayout(req, res, next) {
    try {
      const data = await dashboardService.saveLayout(req.user.id, req.body);
      res.status(200).json({ status: 'success', message: 'Layout saved successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async search(req, res, next) {
    try {
      const { q } = req.query;
      const data = await dashboardService.globalSearch(q);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
