const ProductionMonitoringService = require('../services/production-monitoring.service');
const ApiResponse = require('../../../utils/apiResponse');

class ProductionMonitoringController {
  async getLiveNotifications(req, res) {
    try {
      const data = await ProductionMonitoringService.getLiveNotifications(req.user?.id);
      return ApiResponse.success(res, data, 'Live notifications retrieved successfully');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to fetch live notifications', err.message);
    }
  }

  async getUnreadCount(req, res) {
    try {
      const data = await ProductionMonitoringService.getUnreadCount(req.user?.id);
      return ApiResponse.success(res, data, 'Unread notification counters');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to fetch unread counters', err.message);
    }
  }

  async getQueueDashboard(req, res) {
    try {
      const data = await ProductionMonitoringService.getQueueDashboardStats();
      return ApiResponse.success(res, data, 'Queue Dashboard Statistics');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to fetch queue statistics', err.message);
    }
  }

  async getAnalyticsSummary(req, res) {
    try {
      const data = await ProductionMonitoringService.getAnalyticsSummary();
      return ApiResponse.success(res, data, 'Notification Analytics Summary');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to fetch analytics summary', err.message);
    }
  }

  async getHealthStatus(req, res) {
    try {
      const data = await ProductionMonitoringService.getSystemHealth();
      return ApiResponse.success(res, data, 'System Health Status');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to fetch health status', err.message);
    }
  }

  async getSecurityLogs(req, res) {
    try {
      const data = await ProductionMonitoringService.getSecurityLogs();
      return ApiResponse.success(res, data, 'Security Monitoring Logs');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to fetch security logs', err.message);
    }
  }

  async getDeploymentSpecs(req, res) {
    try {
      const data = await ProductionMonitoringService.getDeploymentSpecs();
      return ApiResponse.success(res, data, 'Deployment Specs & Configuration');
    } catch (err) {
      return ApiResponse.error(res, 'Failed to fetch deployment specs', err.message);
    }
  }
}

module.exports = new ProductionMonitoringController();
