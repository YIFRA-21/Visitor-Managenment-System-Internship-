// src/routes/manager/manager-notification-api.js
// REST API routes for Enterprise Manager Notification Center

const express = require('express');
const router = express.Router();
const { managerPermission } = require('../../../middleware/managerPermission');

const ManagerNotificationController = require('../controllers/manager-notification.controller');
const ManagerApprovalController = require('../controllers/manager-approval.controller');
const ManagerBroadcastController = require('../controllers/manager-broadcast.controller');
const ManagerReminderController = require('../controllers/manager-reminder.controller');
const ManagerAnalyticsController = require('../controllers/manager-analytics.controller');
const ManagerPreferenceController = require('../controllers/manager-preference.controller');

// 1. Dashboard & Notification Center
router.get('/inbox', managerPermission('manager.notification.view'), ManagerNotificationController.getNotifications);
router.post('/inbox/:id/read', managerPermission('manager.notification.view'), ManagerNotificationController.markAsRead);
router.post('/inbox/read-all', managerPermission('manager.notification.view'), ManagerNotificationController.markAllAsRead);
router.post('/inbox/:id/pin', managerPermission('manager.notification.view'), ManagerNotificationController.togglePin);
router.post('/inbox/:id/archive', managerPermission('manager.notification.view'), ManagerNotificationController.archiveNotification);

// 2. Approval Center
router.get('/approvals', managerPermission('manager.notification.approve'), ManagerApprovalController.getPendingApprovals);
router.get('/approvals/:id', managerPermission('manager.notification.approve'), ManagerApprovalController.getApprovalDetails);
router.post('/approvals/:id/approve', managerPermission('manager.notification.approve'), ManagerApprovalController.approveRequest);
router.post('/approvals/:id/reject', managerPermission('manager.notification.approve'), ManagerApprovalController.rejectRequest);
router.post('/approvals/:id/revision', managerPermission('manager.notification.approve'), ManagerApprovalController.returnForRevision);
router.post('/approvals/:id/forward', managerPermission('manager.notification.approve'), ManagerApprovalController.forwardApproval);

// 3. Department Broadcast Center
router.get('/broadcasts', managerPermission('manager.notification.broadcast'), ManagerBroadcastController.getBroadcasts);
router.post('/broadcasts', managerPermission('manager.notification.broadcast'), ManagerBroadcastController.sendBroadcast);

// 4. Reminders & Escalations
router.get('/reminders', managerPermission('manager.notification.view'), ManagerReminderController.getReminders);
router.post('/reminders', managerPermission('manager.notification.view'), ManagerReminderController.createReminder);
router.get('/escalations', managerPermission('manager.notification.view'), ManagerReminderController.getEscalations);
router.post('/escalations/:id/resolve', managerPermission('manager.notification.approve'), ManagerReminderController.resolveEscalation);

// 5. Analytics & Reports
router.get('/analytics', managerPermission('manager.notification.report'), ManagerAnalyticsController.getDashboardAnalytics);
router.get('/reports/export', managerPermission('manager.notification.export'), ManagerAnalyticsController.exportReport);

// 6. Notification Preferences
router.get('/preferences', managerPermission('manager.notification.settings'), ManagerPreferenceController.getPreferences);
router.put('/preferences', managerPermission('manager.notification.settings'), ManagerPreferenceController.updatePreferences);

module.exports = router;
