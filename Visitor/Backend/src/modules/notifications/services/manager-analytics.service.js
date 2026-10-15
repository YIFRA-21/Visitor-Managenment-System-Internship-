// src/services/manager/ManagerAnalyticsService.js
// Analytics Service for Manager Notification KPIs and Reports

const ManagerAnalyticsRepository = require('../repositories/manager-analytics.repository');

class ManagerAnalyticsService {
  async getDashboardAnalytics(scope) {
    return await ManagerAnalyticsRepository.getDashboardAnalytics(scope);
  }

  async generateReport(format, scope) {
    const analytics = await ManagerAnalyticsRepository.getDashboardAnalytics(scope);
    return {
      reportType: 'Manager Department Notification & SLA Performance Report',
      format: format.toUpperCase(),
      generatedAt: new Date().toISOString(),
      departmentName: scope.departmentName,
      metrics: analytics.kpis,
      downloadUrl: `/api/manager/notifications/reports/download?format=${format.toLowerCase()}&token=rpt_${Date.now()}`
    };
  }
}

module.exports = new ManagerAnalyticsService();
