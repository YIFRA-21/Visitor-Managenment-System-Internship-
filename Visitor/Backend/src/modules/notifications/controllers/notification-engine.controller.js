const NotificationEngineService = require('../services/notification-engine.service');
const ApiResponse = require('../../../utils/apiResponse');

class NotificationEngineController {
  async processEvent(req, res) {
    try {
      const { eventName, payload } = req.body;
      const result = await NotificationEngineService.processEvent(eventName, payload || {}, req);
      return ApiResponse.success(res, result, 'Business event processed successfully by Notification Rule Engine');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to process business event', err.message);
    }
  }

  async getStatus(req, res) {
    try {
      const status = await NotificationEngineService.getEngineStatus();
      return ApiResponse.success(res, status, 'Notification Engine Status');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to retrieve engine status', err.message);
    }
  }

  async createRule(req, res) {
    try {
      const newRule = await NotificationEngineService.createRule(req.body, req);
      return ApiResponse.success(res, newRule, 'Notification rule created successfully', 201);
    } catch (err) {
      return ApiResponse.error(res, 'Failed to create notification rule', err.message);
    }
  }

  async getAnalytics(req, res) {
    try {
      const analytics = await NotificationEngineService.getAnalytics();
      return ApiResponse.success(res, analytics, 'Notification Engine Analytics');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to fetch analytics', err.message);
    }
  }
}

module.exports = new NotificationEngineController();
