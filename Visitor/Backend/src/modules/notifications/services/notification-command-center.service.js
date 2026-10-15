// src/services/admin/NotificationCommandCenterService.js
// Service layer for the Enterprise Administrator Notification Command Center
// Provides dashboard metrics, activity feed, and health status aggregation.
// Uses mock data until Sequelize models are fully provisioned.

/**
 * Retrieves aggregated metrics for the admin dashboard.
 * Returns an object with keys matching UI cards.
 */
async function getDashboardMetrics() {
  return {
    totalNotifications: 12480,
    activeNotifications: 342,
    scheduledNotifications: 58,
    pendingNotifications: 14,
    processingNotifications: 3,
    deliveredNotifications: 11200,
    readNotifications: 9800,
    acknowledgedNotifications: 8400,
    failedNotifications: 12,
    retryQueueLength: 2,
    deadLetterQueueLength: 0,
    notificationEngineHealth: { status: 'healthy', latencyMs: 42 },
    smtpStatus: { status: 'healthy', latencyMs: 120 },
    socketStatus: { status: 'healthy', latencyMs: 8 },
    smsGatewayStatus: { status: 'healthy', latencyMs: 350 },
    apiStatus: { status: 'healthy', latencyMs: 12 },
    systemHealthScore: 99.4,
  };
}

/**
 * Retrieves the most recent activity events for the activity feed.
 * Returns an array of objects { timestamp, type, description }.
 */
async function getActivityFeed(limit = 20) {
  return [
    { id: 1, timestamp: new Date().toISOString(), type: 'notification.delivered', description: 'Visitor arrival alert delivered to host David Miller' },
    { id: 2, timestamp: new Date(Date.now() - 60000).toISOString(), type: 'notification.created', description: 'Appointment reminder queued for tomorrow 09:00' },
    { id: 3, timestamp: new Date(Date.now() - 120000).toISOString(), type: 'notification.escalated', description: 'Host unresponsive — escalated to department manager' },
  ].slice(0, limit);
}

module.exports = {
  getDashboardMetrics,
  getActivityFeed,
};
