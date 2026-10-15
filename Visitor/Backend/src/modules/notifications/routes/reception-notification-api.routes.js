// src/routes/reception/reception-notification-api.js
// REST API routes for Enterprise Receptionist Notification Center

const express = require('express');
const router = express.Router();
const { receptionPermission } = require('../../../middleware/receptionPermission');

const ReceptionNotificationController = require('../controllers/reception-notification.controller');
const ReceptionReminderController = require('../controllers/reception-reminder.controller');
const ReceptionQueueNotificationController = require('../controllers/reception-queue-notification.controller');
const ReceptionSecurityNotificationController = require('../controllers/reception-security-notification.controller');
const ReceptionAnalyticsController = require('../controllers/reception-analytics.controller');
const ReceptionPreferenceController = require('../controllers/reception-preference.controller');

// 1. Front-Desk Inbox & Notifications
router.get('/inbox', receptionPermission('reception.notification.view'), ReceptionNotificationController.getNotifications);
router.post('/inbox/:id/read', receptionPermission('reception.notification.manage'), ReceptionNotificationController.markAsRead);
router.post('/inbox/read-all', receptionPermission('reception.notification.manage'), ReceptionNotificationController.markAllAsRead);

// 2. Manual Broadcast & Alert Dispatch
router.post('/send-manual', receptionPermission('reception.notification.send'), ReceptionNotificationController.sendManualNotification);

// 3. Queue Monitoring & Reassignments
router.get('/queue', receptionPermission('reception.notification.receive'), ReceptionQueueNotificationController.getQueueStatus);
router.post('/queue/reassign', receptionPermission('reception.notification.manage'), ReceptionQueueNotificationController.reassignQueue);

// 4. Security & Emergency Alerts
router.get('/security', receptionPermission('reception.notification.view'), ReceptionSecurityNotificationController.getSecurityAlerts);
router.post('/emergency', receptionPermission('reception.notification.send'), ReceptionSecurityNotificationController.triggerEmergencyAlert);

// 5. Automated Reminders
router.get('/reminders', receptionPermission('reception.notification.view'), ReceptionReminderController.getReminders);
router.post('/reminders/:id/trigger', receptionPermission('reception.notification.manage'), ReceptionReminderController.triggerReminder);

// 6. Analytics & Reports
router.get('/analytics', receptionPermission('reception.notification.history'), ReceptionAnalyticsController.getDashboardAnalytics);
router.get('/reports/export', receptionPermission('reception.notification.history'), ReceptionAnalyticsController.exportReport);

// 7. Reception Preferences
router.get('/preferences', receptionPermission('reception.notification.preference'), ReceptionPreferenceController.getPreferences);
router.put('/preferences', receptionPermission('reception.notification.preference'), ReceptionPreferenceController.updatePreferences);

module.exports = router;
