// src/routes/security/security-notification-api.js
// REST API routes for Enterprise Security Officer Notification Center

const express = require('express');
const router = express.Router();
const { securityPermission } = require('../../../middleware/securityPermission');

const SecurityNotificationController = require('../controllers/security-notification.controller');
const SecurityIncidentController = require('../../security-access/controllers/security-incident.controller');
const SecurityAccessControlController = require('../../security-access/controllers/security-access-control.controller');
const SecurityInvestigationController = require('../../security-access/controllers/security-investigation.controller');
const SecurityAnalyticsController = require('../../security-access/controllers/security-analytics.controller');
const SecurityPreferenceController = require('../../security-access/controllers/security-preference.controller');

// 1. Security Alert Feed & Notifications
router.get('/inbox', securityPermission('security.notification.view'), SecurityNotificationController.getNotifications);
router.post('/inbox/:id/acknowledge', securityPermission('security.notification.acknowledge'), SecurityNotificationController.acknowledgeNotification);
router.post('/inbox/:id/escalate', securityPermission('security.notification.escalate'), SecurityNotificationController.escalateNotification);

// 2. Manual Dispatch
router.post('/dispatch', securityPermission('security.notification.respond'), SecurityNotificationController.sendManualDispatch);

// 3. Security Incidents & Emergency Panic Alerts
router.get('/incidents', securityPermission('security.notification.view'), SecurityIncidentController.getIncidents);
router.post('/incidents/emergency', securityPermission('security.notification.respond'), SecurityIncidentController.triggerEmergencyIncident);

// 4. Turnstile & Access Control Violations
router.get('/access-logs', securityPermission('security.notification.view'), SecurityAccessControlController.getAccessLogs);

// 5. Investigation Cases
router.get('/investigations', securityPermission('security.notification.investigate'), SecurityInvestigationController.getCases);
router.post('/investigations', securityPermission('security.notification.investigate'), SecurityInvestigationController.createCase);

// 6. Security Analytics & Reports
router.get('/analytics', securityPermission('security.notification.report'), SecurityAnalyticsController.getDashboardAnalytics);
router.get('/reports/export', securityPermission('security.notification.export'), SecurityAnalyticsController.exportReport);

// 7. Security Preferences
router.get('/preferences', securityPermission('security.notification.view'), SecurityPreferenceController.getPreferences);
router.put('/preferences', securityPermission('security.notification.view'), SecurityPreferenceController.updatePreferences);

module.exports = router;
