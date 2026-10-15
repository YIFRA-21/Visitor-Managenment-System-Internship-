// src/controllers/admin/NotificationCommandCenterController.js
// Controller for the Enterprise Administrator Notification Command Center dashboard
// Provides real‑time metrics about notifications, queues, gateways, and system health.

const NotificationCommandCenterService = require('../services/notification-command-center.service');
const { auditLog } = require('../../../utils/audit'); // assume existing utility

/**
 * GET /api/admin/notifications/dashboard
 * Returns a JSON payload with all dashboard cards metrics.
 */
async function getDashboardMetrics(req, res) {
  try {
    const metrics = await NotificationCommandCenterService.getDashboardMetrics();
    // Log admin view action
    await auditLog({
      userId: req.user.id,
      entity: 'admin_notification_dashboard',
      action: 'view',
      details: { metricsCount: Object.keys(metrics).length }
    });
    res.json({ success: true, data: metrics });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard metrics' });
  }
}

/**
 * GET /api/admin/notifications/activity-feed
 * Returns the latest activity events (delivered, failed, retries, etc.)
 */
async function getActivityFeed(req, res) {
  try {
    const feed = await NotificationCommandCenterService.getActivityFeed();
    res.json({ success: true, data: feed });
  } catch (err) {
    console.error('Activity feed error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve activity feed' });
  }
}

module.exports = {
  getDashboardMetrics,
  getActivityFeed,
};
