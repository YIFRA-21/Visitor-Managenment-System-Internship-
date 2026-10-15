const ManualAnalyticsService = require('../services/manual-analytics.service');
const ManualAuditService = require('../../audit-log/services/manual-audit.service');

class ManualAnalyticsController {
  // GET /api/manual-analytics/kpis
  async getKpis(req, res) {
    try {
      const kpis = await ManualAnalyticsService.getKpis();
      res.json({ success: true, data: kpis });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch analytics KPIs' });
    }
  }

  // GET /api/manual-analytics/charts
  async getCharts(req, res) {
    try {
      const charts = await ManualAnalyticsService.getChartDistributions();
      res.json({ success: true, data: charts });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch chart distributions' });
    }
  }

  // GET /api/manual-analytics/audit-logs
  async getAuditLogs(req, res) {
    try {
      const logs = await ManualAuditService.getAuditLogs(req.query);
      res.json({ success: true, data: logs });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch SIEM audit logs' });
    }
  }

  // GET /api/manual-analytics/permissions
  async getPermissionMatrix(req, res) {
    res.json({
      success: true,
      data: {
        roles: [
          { role: 'Notification Administrator', permissions: ['notification.view', 'notification.create', 'notification.update', 'notification.delete', 'notification.send', 'notification.schedule', 'notification.broadcast', 'notification.approve', 'notification.cancel', 'notification.retry', 'notification.export', 'notification.analytics', 'notification.audit'] },
          { role: 'Notification Manager', permissions: ['notification.view', 'notification.create', 'notification.update', 'notification.send', 'notification.schedule', 'notification.broadcast', 'notification.approve', 'notification.export', 'notification.analytics'] },
          { role: 'Notification Operator', permissions: ['notification.view', 'notification.create', 'notification.send', 'notification.schedule'] },
          { role: 'Notification Viewer', permissions: ['notification.view', 'notification.analytics'] }
        ]
      }
    });
  }
}

module.exports = new ManualAnalyticsController();
