const homeService = require('../services/org-home.service');
const activityService = require('../../visitor-history/services/activity.service');

class OrganizationHomeController {
  async getHome(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      const data = await homeService.getHomeData(operatorId);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getCards(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      const result = await homeService.getCards(operatorId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getCharts(req, res, next) {
    try {
      const result = await homeService.getCharts();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const result = await homeService.getStatistics();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getActivities(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      if (isNaN(limit) || limit <= 0) {
        return res.status(200).json({ success: true, data: [] });
      }
      const result = await activityService.getActivities(limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getQuickActions(req, res, next) {
    try {
      const operatorId = req.user?.id || req.user?.userId || 1;
      const result = await homeService.getQuickActions(operatorId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async search(req, res, next) {
    try {
      const query = req.query.query || req.query.q || req.query.search || '';
      const type = req.query.type || 'all';

      const result = await homeService.search({ query, type });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrganizationHomeController();
