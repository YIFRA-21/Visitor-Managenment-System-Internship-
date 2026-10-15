const visitorDashboardService = require('../services/visitor-dashboard.service');

class VisitorDashboardController {
  async getDashboard(req, res, next) {
    try {
      const data = await visitorDashboardService.getDashboardOverview(req.user, req.query);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getCards(req, res, next) {
    try {
      const data = await visitorDashboardService.getCards(req.user, req.query);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getCharts(req, res, next) {
    try {
      const data = await visitorDashboardService.getCharts(req.user, req.query);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getRecent(req, res, next) {
    try {
      const data = await visitorDashboardService.getRecent(req.user, req.query);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getAlerts(req, res, next) {
    try {
      const data = await visitorDashboardService.getAlerts(req.user, req.query);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getTasks(req, res, next) {
    try {
      const data = await visitorDashboardService.getTasks(req.user, req.query);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async search(req, res, next) {
    try {
      const queryStr = req.query.q || req.query.search || '';
      const data = await visitorDashboardService.search(req.user, queryStr, req.query);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const data = await visitorDashboardService.getStatistics(req.user, req.query);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VisitorDashboardController();
