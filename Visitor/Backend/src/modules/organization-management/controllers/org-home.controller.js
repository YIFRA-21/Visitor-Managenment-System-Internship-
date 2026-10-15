const homeService = require('../services/org-home.service');
const dashboardService = require('../../dashboards/services/dashboard.service');
const statisticsService = require('../../reporting-analytics/services/statistics.service');
const activityService = require('../../visitor-history/services/activity.service');

const { collectErrors, ValidationError, sendValidationErrors } = require('../../../middleware/validators/commonValidator');

class OrganizationHomeController {
  async getHome(req, res, next) {
    try {
      const data = await homeService.getHomeData(req.user.id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  async getCards(req, res, next) {
    try {
      const result = await dashboardService.getCards(req.user.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getCharts(req, res, next) {
    try {
      const result = await statisticsService.getCharts();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const result = await statisticsService.getStatistics();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getActivities(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: [{ field: 'limit', message: 'Limit must be a positive integer' }]
        });
      }
      const result = await activityService.getActivities(limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getQuickActions(req, res, next) {
    try {
      const result = await homeService.getQuickActions(req.user.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async search(req, res, next) {
    try {
      const { query, type } = req.query;

      // Validate search parameters
      const errors = [];
      if (!query || query.trim() === '') {
        errors.push(new ValidationError('query', 'Search query is required'));
      } else if (query.length < 2) {
        errors.push(new ValidationError('query', 'Search query must be at least 2 characters'));
      }

      const allowedTypes = ['all', 'organization', 'branch', 'department', 'activity', 'code', 'quick_action'];
      if (type && !allowedTypes.includes(type)) {
        errors.push(new ValidationError('type', `Search type must be one of: ${allowedTypes.join(', ')}`));
      }

      if (errors.length > 0) {
        return sendValidationErrors(res, errors);
      }

      const result = await homeService.search({ query, type });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrganizationHomeController();
